import { inMemoryStore } from './inMemoryStore.js';
import { createApiKey, createResetToken, createSessionToken, hashPassword, maskApiKey, needsPasswordRehash, verifyPassword } from '../utils/security.js';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const now = () => new Date().toISOString();
const passwordResetTokens = [];
const PRIMARY_ADMIN_EMAIL = 'admin@ppooint.com';
const PRIMARY_ADMIN_PASSWORD = 'PPOINNT@Admin123';

const rolePermissions = {
  'Super Admin': ['overview', 'addresses', 'moderation', 'businesses', 'agents', 'developers', 'usage', 'plans', 'payments', 'regions', 'registry', 'dispatch', 'settings'],
  'Admin': ['overview', 'addresses', 'moderation', 'businesses', 'agents', 'regions', 'registry', 'dispatch'],
  'Manager': ['overview', 'addresses', 'moderation', 'businesses', 'agents', 'regions', 'registry', 'dispatch'],
  'Field Officer': ['addresses', 'agents', 'regions', 'dispatch'],
};

const plans = [
  { id: 1, name: 'Starter Plan', slug: 'starter', description: 'For early stage apps that need verified address lookup and generation.', price_ngn: 30000, price_usd: 19, request_limit: 10000, is_active: true },
  { id: 2, name: 'Growth Plan', slug: 'growth', description: 'For scaling products across multiple cities and operational teams.', price_ngn: 150000, price_usd: 99, request_limit: 100000, is_active: true },
  { id: 3, name: 'Enterprise Plan', slug: 'enterprise', description: 'For national platforms, government rails, and deep logistics operations.', price_ngn: 750000, price_usd: 499, request_limit: null, is_active: true },
  { id: 4, name: 'Logistics API Plan', slug: 'logistics', description: 'For delivery and routing systems that need bulk verification and navigation support.', price_ngn: 300000, price_usd: 200, request_limit: 250000, is_active: true }
];

const settings = {
  platform_name: 'PPOINT Africa',
  domain: 'ppoint.africa',
  api_base_url: 'https://api.ppoint.africa/api',
  api_rate_limit: 100,
  address_settings: {
    require_building_name: true,
    show_landmark: true,
    show_street_description: true,
    show_phone_number: true,
    enable_house_number: true,
    enable_district: true,
    quick_create_target_seconds: 5,
  },
  qr_enabled: true,
  payment_methods: {
    bank_transfer_ng: true,
    flutterwave: false,
    paystack: false,
  },
  bank_transfer_details: {
    bank_name: 'PPOINT Bank',
    account_name: 'PPOINT Africa Ltd',
    account_number: '0123456789',
  },
  support_contacts: {
    support_email: 'support@ppoinnt.africa',
    business_email: 'business@ppoinnt.africa',
    support_phone_number: '+234-800-PPOINNT',
    emergency_contact_number: '+234-800-EMERGENCY',
  },
  map_api_keys: {
    public_map_key: 'openstreetmap',
    routing_key: '',
  },
  currency_settings: {
    default_currency: 'USD',
    nigeria_currency: 'NGN',
    exchange_note: 'Admin editable pricing by currency',
  }
};

const buildAdminUsers = () => {
  const users = [
    {
      id: 1,
      email: PRIMARY_ADMIN_EMAIL,
      full_name: 'Platform Owner',
      role: 'Super Admin',
      password_hash: hashPassword(PRIMARY_ADMIN_PASSWORD),
      created_at: now(),
    }
  ];

  const configuredEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim();

  if (configuredEmail && configuredPassword && configuredEmail !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    users.push({
      id: 2,
      email: configuredEmail,
      full_name: 'Platform Owner',
      role: 'Super Admin',
      password_hash: hashPassword(configuredPassword),
      created_at: now(),
    });
  }

  return users;
};

const adminUsers = buildAdminUsers();

const adminSessions = [];
const developerSessions = [];
const developers = [];
const apiUsage = [];
const payments = [];
const developerPasswordResetTokens = [];

let nextDeveloperId = 1;
let nextUsageId = 1;
let nextPaymentId = 1;

const getPlanBySlug = (slug) => plans.find((plan) => plan.slug === slug && plan.is_active);
const formatDeveloperCode = (developerId) => `DEV-${String(developerId).padStart(5, '0')}`;
const formatResetResponse = (message, extras = {}) => ({ status: 'success', success: true, message, ...extras });
const resolvePlanLimit = (plan) => plan?.request_limit ?? null;
const cleanExpiredDeveloperResetTokens = () => {
  const activeEntries = developerPasswordResetTokens.filter((item) => item.expires_at >= Date.now());
  developerPasswordResetTokens.length = 0;
  developerPasswordResetTokens.push(...activeEntries);
};

const getDeveloperUsageRow = (developerId, month = currentMonth()) => {
  let row = apiUsage.find((item) => item.developer_id === developerId && item.month === month);

  if (!row) {
    row = { id: nextUsageId++, developer_id: developerId, request_count: 0, month, updated_at: now() };
    apiUsage.push(row);
  }

  return row;
};

const sanitizeDeveloper = (developer, { revealApiKey = false } = {}) => {
  if (!developer) {
    return null;
  }

  const plan = plans.find((item) => item.slug === developer.plan_slug) || null;
  const usage = getDeveloperUsageRow(developer.id);

  return {
    id: developer.id,
    developer_id: formatDeveloperCode(developer.id),
    company_name: developer.company_name,
    website: developer.website,
    email: developer.email,
    plan_slug: developer.plan_slug,
    plan_name: plan?.name || developer.plan_slug,
    request_limit: resolvePlanLimit(plan),
    status: developer.status,
    billing_country: developer.billing_country,
    billing_currency: developer.billing_currency,
    api_key: revealApiKey ? developer.api_key : maskApiKey(developer.api_key),
    request_count: usage.request_count,
    remaining_requests: resolvePlanLimit(plan) === null ? 'Unlimited' : Math.max((plan?.request_limit || 0) - usage.request_count, 0),
    month: usage.month,
    created_at: developer.created_at,
    subscription_active: developer.status === 'active',
  };
};

const sanitizePayment = (payment) => {
  const developer = developers.find((item) => item.id === payment.developer_id);
  const plan = plans.find((item) => item.slug === payment.plan_slug);

  return {
    ...payment,
    developer_company: developer?.company_name || null,
    developer_email: developer?.email || null,
    plan_name: plan?.name || payment.plan_slug,
  };
};

export const platformStore = {
  ensureDefaultAdmin() {
    if (!adminUsers.some((item) => item.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase())) {
      adminUsers.unshift({
        id: 1,
        email: PRIMARY_ADMIN_EMAIL,
        full_name: 'Platform Owner',
        role: 'Super Admin',
        password_hash: hashPassword(PRIMARY_ADMIN_PASSWORD),
        created_at: now(),
      });
    }

    return adminUsers[0];
  },

  getPublicPlans() {
    return plans
      .filter((plan) => plan.is_active)
      .map((plan) => ({
        name: plan.name,
        slug: plan.slug,
        limit: plan.request_limit,
        request_limit: plan.request_limit,
      }));
  },

  getPlans() {
    return plans.map((plan) => ({ ...plan }));
  },

  updatePlan(id, payload) {
    const plan = plans.find((item) => item.id === Number(id));
    if (!plan) {
      return null;
    }

    Object.assign(plan, {
      name: payload.name ?? plan.name,
      description: payload.description ?? plan.description,
      price_ngn: payload.priceNgn ?? payload.price_ngn ?? plan.price_ngn,
      price_usd: payload.priceUsd ?? payload.price_usd ?? plan.price_usd,
      request_limit: payload.requestLimit ?? payload.request_limit ?? plan.request_limit,
      is_active: payload.isActive ?? payload.is_active ?? plan.is_active,
    });

    return { ...plan };
  },

  createPlan(payload) {
    const slug = String(payload.slug || '').trim().toLowerCase();
    if (!payload.name || !slug) {
      const error = new Error('Plan name and slug are required');
      error.status = 400;
      throw error;
    }

    if (plans.some((plan) => plan.slug === slug)) {
      const error = new Error('A plan with this slug already exists');
      error.status = 409;
      throw error;
    }

    const nextPlanId = Math.max(...plans.map((plan) => plan.id), 0) + 1;
    const plan = {
      id: nextPlanId,
      name: payload.name,
      slug,
      description: payload.description || '',
      price_ngn: Number(payload.price_ngn ?? payload.priceNgn ?? 0),
      price_usd: Number(payload.price_usd ?? payload.priceUsd ?? 0),
      request_limit: payload.request_limit ?? payload.requestLimit ?? 0,
      is_active: payload.is_active ?? payload.isActive ?? true,
    };

    plans.push(plan);
    return { ...plan };
  },

  deletePlan(id) {
    const plan = plans.find((item) => item.id === Number(id));
    if (!plan) {
      return null;
    }

    plan.is_active = false;
    return { ...plan };
  },

  getSettings() {
    return JSON.parse(JSON.stringify(settings));
  },

  getPublicPlatformConfig() {
    return {
      platform_name: settings.platform_name,
      domain: settings.domain,
      api_base_url: settings.api_base_url,
      address_settings: { ...settings.address_settings },
      qr_enabled: settings.qr_enabled,
      support_contacts: { ...settings.support_contacts },
    };
  },

  updateSettings(payload) {
    Object.assign(settings, {
      platform_name: payload.platformName ?? payload.platform_name ?? settings.platform_name,
      domain: payload.domain ?? settings.domain,
      api_base_url: payload.apiBaseUrl ?? payload.api_base_url ?? settings.api_base_url,
      api_rate_limit: payload.apiRateLimit ?? payload.api_rate_limit ?? settings.api_rate_limit,
      qr_enabled: payload.qrEnabled ?? payload.qr_enabled ?? settings.qr_enabled,
    });

    if (payload.payment_methods) {
      settings.payment_methods = { ...settings.payment_methods, ...payload.payment_methods };
    }

    if (payload.address_settings) {
      settings.address_settings = { ...settings.address_settings, ...payload.address_settings };
    }

    if (payload.bank_transfer_details) {
      settings.bank_transfer_details = { ...settings.bank_transfer_details, ...payload.bank_transfer_details };
    }

    if (payload.support_contacts) {
      settings.support_contacts = { ...settings.support_contacts, ...payload.support_contacts };
    }

    if (payload.map_api_keys) {
      settings.map_api_keys = { ...settings.map_api_keys, ...payload.map_api_keys };
    }

    if (payload.currency_settings) {
      settings.currency_settings = { ...settings.currency_settings, ...payload.currency_settings };
    }

    return this.getSettings();
  },

  authenticateAdmin(email, password) {
    this.ensureDefaultAdmin();
    const admin = adminUsers.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return null;
    }

    if (needsPasswordRehash(admin.password_hash)) {
      admin.password_hash = hashPassword(password);
    }

    return admin;
  },

  createAdminSession(adminId) {
    const token = createSessionToken('adm');
    adminSessions.push({ token, admin_id: adminId, created_at: now() });
    return token;
  },

  getAdminBySession(token) {
    const session = adminSessions.find((item) => item.token === token);
    if (!session) {
      return null;
    }

    const admin = adminUsers.find((item) => item.id === session.admin_id);
    return admin ? {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
      permissions: rolePermissions[admin.role] || [],
      created_at: admin.created_at,
    } : null;
  },

  createPasswordResetToken(email) {
    const admin = adminUsers.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
    if (!admin) {
      const error = new Error('No admin account found for that email');
      error.status = 404;
      throw error;
    }

    const token = createResetToken('rst');
    passwordResetTokens.push({
      token,
      admin_id: admin.id,
      expires_at: Date.now() + (30 * 60 * 1000),
      created_at: now(),
    });

    return {
      success: true,
      message: 'Password reset token created',
      reset_token: token,
      expires_in_minutes: 30,
    };
  },

  resetPassword(token, newPassword) {
    const entry = passwordResetTokens.find((item) => item.token === token);
    if (!entry || entry.expires_at < Date.now()) {
      const error = new Error('Reset token is invalid or expired');
      error.status = 400;
      throw error;
    }

    const admin = adminUsers.find((item) => item.id === entry.admin_id);
    if (!admin) {
      const error = new Error('Admin account no longer exists');
      error.status = 404;
      throw error;
    }

    if (!newPassword || String(newPassword).length < 8) {
      const error = new Error('New password must be at least 8 characters long');
      error.status = 400;
      throw error;
    }

    admin.password_hash = hashPassword(newPassword);

    const tokenIndex = passwordResetTokens.findIndex((item) => item.token === token);
    if (tokenIndex >= 0) {
      passwordResetTokens.splice(tokenIndex, 1);
    }

    return {
      success: true,
      message: 'Password reset successful',
    };
  },

  registerDeveloper({ companyName, website, email, password, planSlug = 'starter', billingCountry = 'NG' }) {
    if (!companyName || !website || !email || !password || !billingCountry || !planSlug) {
      const error = new Error('Company name, website, email, password, country, and plan are required');
      error.status = 400;
      throw error;
    }

    if (developers.some((item) => item.email.toLowerCase() === String(email).toLowerCase())) {
      const error = new Error('Email already exists');
      error.status = 409;
      throw error;
    }

    const plan = getPlanBySlug(planSlug);
    if (!plan) {
      const error = new Error('Selected plan is not available');
      error.status = 400;
      throw error;
    }

    const billingCurrency = String(billingCountry).toUpperCase() === 'NG' ? 'NGN' : 'USD';
    const status = 'active';
    const developer = {
      id: nextDeveloperId++,
      company_name: companyName,
      website,
      email,
      password_hash: hashPassword(password),
      plan_slug: plan.slug,
      status,
      billing_country: String(billingCountry).toUpperCase(),
      billing_currency: billingCurrency,
      api_key: createApiKey(),
      created_at: now(),
      updated_at: now(),
    };

    developers.push(developer);
    getDeveloperUsageRow(developer.id);
    return sanitizeDeveloper(developer, { revealApiKey: true });
  },

  authenticateDeveloper(email, password) {
    const developer = developers.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
    if (!developer || !verifyPassword(password, developer.password_hash)) {
      return null;
    }

    if (needsPasswordRehash(developer.password_hash)) {
      developer.password_hash = hashPassword(password);
      developer.updated_at = now();
    }

    return developer;
  },

  createDeveloperSession(developerId) {
    const token = createSessionToken('dev');
    developerSessions.push({ token, developer_id: developerId, created_at: now() });
    return token;
  },

  getDeveloperBySession(token) {
    const session = developerSessions.find((item) => item.token === token);
    if (!session) {
      return null;
    }

    const developer = developers.find((item) => item.id === session.developer_id);
    return sanitizeDeveloper(developer, { revealApiKey: true });
  },

  getDeveloperRecordByApiKey(apiKey) {
    return developers.find((item) => item.api_key === apiKey) || null;
  },

  getDeveloperDashboard(developerId) {
    const developer = developers.find((item) => item.id === Number(developerId));
    if (!developer) {
      return null;
    }

    return {
      developer: sanitizeDeveloper(developer, { revealApiKey: true }),
      plan: plans.find((item) => item.slug === developer.plan_slug) || null,
      usage: this.getDeveloperUsage(developer.id),
      payments: payments.filter((payment) => payment.developer_id === developer.id).map((payment) => sanitizePayment(payment)).sort((left, right) => right.created_at.localeCompare(left.created_at)),
      payment_settings: this.getSettings(),
      support_contacts: { ...settings.support_contacts },
      documentation: {
        resolve_endpoint: '/api/resolve/:ppooint_code',
        bulk_endpoint: '/api/bulk/resolve',
        route_endpoint: '/api/route',
        intelligence_endpoint: '/api/intelligence/:ppooint_code',
        response_example: {
          ppooint_code: 'PPT-NG-LAG-IKD-X4D9T',
          latitude: 6.599475,
          longitude: 3.348890,
          place_type: 'Shop',
          building_name: 'Zenith Bank Ikorodu',
          city: 'Ikorodu',
          state: 'Lagos',
          confidence_score: 95,
          entrance_latitude: 6.599480,
          entrance_longitude: 3.348900
        },
      },
    };
  },

  getDeveloperUsage(developerId) {
    const usage = getDeveloperUsageRow(Number(developerId));
    const developer = developers.find((item) => item.id === Number(developerId));
    const plan = plans.find((item) => item.slug === developer?.plan_slug);

    return {
      ...usage,
      request_limit: resolvePlanLimit(plan),
      remaining_requests: resolvePlanLimit(plan) === null ? 'Unlimited' : Math.max((plan?.request_limit || 0) - usage.request_count, 0),
      usage_percent: plan?.request_limit ? Math.round((usage.request_count / plan.request_limit) * 100) : 0,
    };
  },

  createDeveloperPasswordReset(email) {
    cleanExpiredDeveloperResetTokens();
    const developer = developers.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
    if (!developer) {
      const error = new Error('Developer not found');
      error.status = 404;
      throw error;
    }

    const token = createResetToken('devrst');
    developerPasswordResetTokens.push({
      token,
      developer_id: developer.id,
      expires_at: Date.now() + (30 * 60 * 1000),
      created_at: now(),
    });

    return formatResetResponse('Password reset email sent', {
      reset_token: token,
      reset_link: `${process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5183'}/developers?resetToken=${token}`,
      expires_in_minutes: 30,
    });
  },

  resetDeveloperPassword(token, password) {
    cleanExpiredDeveloperResetTokens();
    const resetEntry = developerPasswordResetTokens.find((item) => item.token === token);
    if (!resetEntry) {
      const error = new Error('Reset token is invalid or expired');
      error.status = 400;
      throw error;
    }

    if (!password || String(password).length < 8) {
      const error = new Error('Password must be at least 8 characters long');
      error.status = 400;
      throw error;
    }

    const developer = developers.find((item) => item.id === resetEntry.developer_id);
    if (!developer) {
      const error = new Error('Developer not found');
      error.status = 404;
      throw error;
    }

    developer.password_hash = hashPassword(password);
    developer.updated_at = now();
    const nextTokens = developerPasswordResetTokens.filter((item) => item.token !== token);
    developerPasswordResetTokens.length = 0;
    developerPasswordResetTokens.push(...nextTokens);

    return formatResetResponse('Developer password reset successful');
  },

  submitPaymentProof(developerId, { planSlug, paymentMethod, proofName, proofData, proofReference }) {
    const developer = developers.find((item) => item.id === Number(developerId));
    const plan = getPlanBySlug(planSlug);
    if (!developer || !plan) {
      throw new Error('Developer or plan not found');
    }

    const amount = developer.billing_currency === 'NGN' ? plan.price_ngn : plan.price_usd;
    const payment = {
      id: nextPaymentId++,
      developer_id: developer.id,
      plan_slug: plan.slug,
      payment_method: paymentMethod,
      amount,
      currency: developer.billing_currency,
      proof_name: proofName || null,
      proof_data: proofData || null,
      proof_reference: proofReference || null,
      status: 'pending',
      created_at: now(),
      reviewed_at: null,
    };

    payments.push(payment);
    developer.status = 'pending_payment';
    developer.updated_at = now();
    return sanitizePayment(payment);
  },

  listPayments() {
    return payments.map((payment) => sanitizePayment(payment)).sort((left, right) => right.created_at.localeCompare(left.created_at));
  },

  reviewPayment(paymentId, status) {
    const payment = payments.find((item) => item.id === Number(paymentId));
    if (!payment) {
      return null;
    }

    payment.status = status;
    payment.reviewed_at = now();

    const developer = developers.find((item) => item.id === payment.developer_id);
    if (developer) {
      developer.updated_at = now();
      if (status === 'approved') {
        developer.status = 'active';
        developer.plan_slug = payment.plan_slug;
        developer.api_key ||= createApiKey();
      }
      if (status === 'rejected') {
        developer.status = 'pending_payment';
      }
    }

    return sanitizePayment(payment);
  },

  listDevelopers() {
    return developers.map((developer) => sanitizeDeveloper(developer)).sort((left, right) => right.created_at.localeCompare(left.created_at));
  },

  setDeveloperStatus(id, status) {
    const developer = developers.find((item) => item.id === Number(id));
    if (!developer) {
      return null;
    }

    developer.status = status;
    developer.updated_at = now();
    if (status === 'active') {
      developer.api_key ||= createApiKey();
    }

    return sanitizeDeveloper(developer);
  },

  resetDeveloperApiKey(id) {
    const developer = developers.find((item) => item.id === Number(id));
    if (!developer) {
      return null;
    }

    developer.api_key = createApiKey();
    developer.updated_at = now();
    return sanitizeDeveloper(developer, { revealApiKey: true });
  },

  updateDeveloperAccount(id, payload) {
    const developer = developers.find((item) => item.id === Number(id));
    if (!developer) {
      return null;
    }

    if (!payload.companyName || !payload.website || !payload.email) {
      const error = new Error('Company name, website, and email are required');
      error.status = 400;
      throw error;
    }

    const normalizedEmail = String(payload.email).toLowerCase();
    if (developers.some((item) => item.id !== developer.id && item.email.toLowerCase() === normalizedEmail)) {
      const error = new Error('Email already exists');
      error.status = 409;
      throw error;
    }

    developer.company_name = payload.companyName;
    developer.website = payload.website;
    developer.email = payload.email;

    if (payload.password) {
      if (String(payload.password).length < 8) {
        const error = new Error('Password must be at least 8 characters long');
        error.status = 400;
        throw error;
      }

      developer.password_hash = hashPassword(payload.password);
    }

    developer.updated_at = now();
    return sanitizeDeveloper(developer, { revealApiKey: true });
  },

  updateDeveloperPlan(id, planSlug) {
    const developer = developers.find((item) => item.id === Number(id));
    const plan = getPlanBySlug(planSlug);
    if (!developer || !plan) {
      return null;
    }

    developer.plan_slug = plan.slug;
    developer.updated_at = now();
    return sanitizeDeveloper(developer);
  },

  resetDeveloperUsage(id) {
    const developer = developers.find((item) => item.id === Number(id));
    if (!developer) {
      return null;
    }

    const usage = getDeveloperUsageRow(developer.id);
    usage.request_count = 0;
    usage.updated_at = now();
    return this.getDeveloperUsage(developer.id);
  },

  regenerateDeveloperApiKey(developerId) {
    return this.resetDeveloperApiKey(developerId);
  },

  consumeApiUsage(apiKey) {
    const developer = this.getDeveloperRecordByApiKey(apiKey);
    if (!developer) {
      const error = new Error('Invalid API key');
      error.status = 401;
      throw error;
    }

    if (developer.status !== 'active') {
      const error = new Error('Developer access is not active');
      error.status = 403;
      throw error;
    }

    const plan = plans.find((item) => item.slug === developer.plan_slug);
    const usage = getDeveloperUsageRow(developer.id);
    if (plan?.request_limit && usage.request_count >= plan.request_limit) {
      const error = new Error('API request limit exceeded for this month');
      error.status = 429;
      throw error;
    }

    usage.request_count += 1;
    usage.updated_at = now();

    return { developer: sanitizeDeveloper(developer), usage: this.getDeveloperUsage(developer.id) };
  },

  listUsage() {
    return apiUsage.map((usage) => {
      const developer = developers.find((item) => item.id === usage.developer_id);
      const plan = plans.find((item) => item.slug === developer?.plan_slug);
      return {
        ...usage,
        developer_company: developer?.company_name || null,
        developer_email: developer?.email || null,
        plan_name: plan?.name || null,
        request_limit: resolvePlanLimit(plan),
        abnormal_usage: Boolean(plan?.request_limit && usage.request_count >= plan.request_limit * 0.8),
      };
    }).sort((left, right) => right.request_count - left.request_count);
  },

  getOverview() {
    const addresses = inMemoryStore.getAddresses({});
    const usage = this.listUsage() || [];
    const countries = inMemoryStore.getAdminCountries() || [];
    const businesses = inMemoryStore.listBusinesses() || [];
    const moderationQueues = inMemoryStore.getModerationQueues() || {};

    return {
      total_addresses: addresses.length,
      total_developers: developers.length,
      total_businesses: businesses.length,
      total_countries: countries.length,
      active_countries: countries.filter((c) => c.is_active).length,
      verified_businesses: businesses.filter((item) => item.status === 'approved').length,
      pending_business_verification: (moderationQueues.pending_business_verification || []).length,
      reported_addresses: (moderationQueues.reported_addresses || []).length,
      suspicious_activity: (moderationQueues.suspicious_activity || []).length,
      low_confidence_addresses: (moderationQueues.low_confidence_addresses || []).length,
      unverified_buildings: (moderationQueues.unverified_buildings || []).length,
      active_developers: developers.filter((item) => item.status === 'active').length,
      pending_payments: payments.filter((item) => item.status === 'pending').length,
      monthly_api_requests: usage.reduce((sum, item) => sum + (item.request_count || 0), 0),
    };
  },
};
