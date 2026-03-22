import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, CreditCard, FileText, KeyRound, RefreshCw, Settings2, Wallet } from 'lucide-react';
import api from '../services/api';

const initialRegisterForm = {
  companyName: '',
  website: '',
  email: '',
  password: '',
  planSlug: 'starter',
  billingCountry: 'NG',
};

const initialLoginForm = {
  email: '',
  password: '',
};

const dashboardTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'api-keys', label: 'API Keys', icon: KeyRound },
  { id: 'usage', label: 'API Usage', icon: BarChart3 },
  { id: 'plan', label: 'Subscription Plan', icon: CreditCard },
  { id: 'billing', label: 'Billing', icon: Wallet },
  { id: 'settings', label: 'Account Settings', icon: Settings2 },
];

const paymentMethods = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'paystack', label: 'Paystack (optional later)' },
  { value: 'flutterwave', label: 'Flutterwave (optional later)' },
];

const inputClassName = 'w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none';
const selectClassName = 'w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none';

const formatMonthLabel = (isoMonth) => {
  if (!isoMonth) {
    return 'Unknown';
  }

  const [year, month] = String(isoMonth).split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const formatLimitValue = (value) => (value === null || value === 'Unlimited' ? 'Unlimited' : Number(value || 0).toLocaleString());
const formatLimitLabel = (value) => (value === null || value === 'Unlimited' ? 'Unlimited' : `${Number(value || 0).toLocaleString()} requests`);

export default function DevelopersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [countries, setCountries] = useState([]);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [developerToken, setDeveloperToken] = useState(localStorage.getItem('ppoint_developer_session') || '');
  const [dashboard, setDashboard] = useState(null);
  const [mode, setMode] = useState('register');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    planSlug: 'growth',
    paymentMethod: 'bank_transfer',
    proofName: '',
    proofData: '',
    proofReference: '',
  });
  const [accountForm, setAccountForm] = useState({
    companyName: '',
    website: '',
    email: '',
    password: '',
  });

  const currency = registerForm.billingCountry === 'NG' ? 'NGN' : 'USD';
  const authHeaders = useMemo(() => (developerToken ? { Authorization: `Bearer ${developerToken}` } : {}), [developerToken]);

  const formatPrice = (plan) => {
    const amount = currency === 'NGN' ? (plan.price_ngn ?? 0) : (plan.price_usd ?? 0);
    return currency === 'NGN' ? `₦${Number(amount).toLocaleString()}` : `$${Number(amount).toLocaleString()}`;
  };

  const loadPlans = async () => {
    setPlansLoading(true);
    const response = await api.get('/plans');
    const nextPlans = Array.isArray(response.data) ? response.data : (response.data.data || []);
    setPlans(nextPlans);
    if (nextPlans.length) {
      setRegisterForm((previous) => ({
        ...previous,
        planSlug: previous.planSlug || nextPlans[0].slug || 'starter',
      }));
      setPaymentForm((previous) => ({
        ...previous,
        planSlug: previous.planSlug || nextPlans.find((plan) => plan.slug !== 'starter')?.slug || nextPlans[0].slug,
      }));
    }
    setPlansLoading(false);
  };

  const loadCountries = async () => {
    const response = await api.get('/countries');
    const nextCountries = Array.isArray(response.data) ? response.data : [];
    setCountries(nextCountries);
    if (nextCountries.length) {
      setRegisterForm((previous) => ({
        ...previous,
        billingCountry: nextCountries.some((country) => country.code === previous.billingCountry) ? previous.billingCountry : nextCountries[0].code,
      }));
    }
  };

  const loadDashboard = async (token = developerToken) => {
    if (!token) {
      return;
    }

    const response = await api.get('/developers/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    setDashboard(response.data.data);
  };

  useEffect(() => {
    loadPlans().catch((requestError) => setError(requestError.response?.data?.message || 'Failed to load developer plans.'));
    loadCountries().catch((requestError) => setError(requestError.response?.data?.message || 'Failed to load African countries.'));
  }, []);

  useEffect(() => {
    const nextResetToken = new URLSearchParams(location.search).get('resetToken') || '';
    if (nextResetToken) {
      setMode('login');
      setShowForgotPassword(true);
      setResetToken(nextResetToken);
    }
  }, [location.search]);

  useEffect(() => {
    if (location.state?.apiKey) {
      setNotice(`Developer account created successfully. API key: ${location.state.apiKey}`);
    }
  }, [location.state]);

  useEffect(() => {
    if (!developerToken) {
      return;
    }

    loadDashboard().catch(() => {
      setError('Developer session expired.');
      setDeveloperToken('');
      setDashboard(null);
      localStorage.removeItem('ppoint_developer_session');
    });
  }, [developerToken]);

  useEffect(() => {
    if (!dashboard?.developer) {
      return;
    }

    setAccountForm({
      companyName: dashboard.developer.company_name || '',
      website: dashboard.developer.website || '',
      email: dashboard.developer.email || '',
      password: '',
    });
  }, [dashboard]);

  const submitRegistration = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const registerResponse = await api.post('/developers/register', {
        company_name: registerForm.companyName,
        website: registerForm.website,
        email: registerForm.email,
        password: registerForm.password,
        country: registerForm.billingCountry,
        plan: registerForm.planSlug,
      });
      const loginResponse = await api.post('/developers/login', {
        email: registerForm.email,
        password: registerForm.password,
      });

      const token = loginResponse.data.data.token;
      localStorage.setItem('ppoint_developer_session', token);
      setDeveloperToken(token);
      setDashboard(loginResponse.data.data.dashboard);
      setNotice(registerResponse.data.message || 'Developer account created successfully.');
      navigate('/developer/dashboard', { replace: true, state: { apiKey: registerResponse.data.api_key } });
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to create developer account.');
    } finally {
      setLoading(false);
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.post('/developers/login', loginForm);
      const token = response.data.data.token;
      localStorage.setItem('ppoint_developer_session', token);
      setDeveloperToken(token);
      setDashboard(response.data.data.dashboard);
      setActiveTab('dashboard');
      setNotice(response.data.message || 'Developer login successful.');
      navigate('/developer/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to log in developer account.');
    } finally {
      setLoading(false);
    }
  };

  const submitForgotPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.post('/developers/forgot-password', { email: forgotPasswordEmail });
      setResetToken(response.data.reset_token || '');
      setNotice(response.data.message || 'Password reset email sent');
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.post('/developers/reset-password', { token: resetToken, password: resetPasswordValue });
      setNotice(response.data.message || 'Developer password reset successful.');
      setShowForgotPassword(false);
      setLoginForm((previous) => ({ ...previous, password: resetPasswordValue }));
      setResetPasswordValue('');
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to reset developer password.');
    } finally {
      setLoading(false);
    }
  };

  const regenerateApiKey = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.post('/developers/api-key/regenerate', {}, { headers: authHeaders });
      await loadDashboard();
      setNotice(response.data.message || 'API key generated successfully.');
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to generate a new API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleProofFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await file.text().catch(() => null);
    if (dataUrl) {
      setPaymentForm((previous) => ({ ...previous, proofName: file.name, proofData: dataUrl }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPaymentForm((previous) => ({ ...previous, proofName: file.name, proofData: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.post('/developers/payments', paymentForm, { headers: authHeaders });
      await loadDashboard();
      setNotice(response.data.message || 'Payment proof submitted successfully.');
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to submit payment proof.');
    } finally {
      setLoading(false);
    }
  };

  const logoutDeveloper = () => {
    localStorage.removeItem('ppoint_developer_session');
    setDeveloperToken('');
    setDashboard(null);
    setNotice(null);
    navigate('/developers', { replace: true });
  };

  const saveAccountSettings = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        companyName: accountForm.companyName,
        website: accountForm.website,
        email: accountForm.email,
      };

      if (accountForm.password.trim()) {
        payload.password = accountForm.password;
      }

      const response = await api.patch('/developers/account', payload, { headers: authHeaders });
      await loadDashboard();
      setAccountForm((previous) => ({ ...previous, password: '' }));
      setNotice(response.data.message || 'Developer account updated successfully.');
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.response?.data?.error || 'Failed to update developer account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {!dashboard ? (
        <>
          <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Developers</p>
              <h1 className="mt-3 text-4xl font-black text-white">Build on PPOINNT Africa digital addressing.</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-stone-200">
                Register your company, choose a subscription plan, obtain an API key, search PPOINNT codes, and integrate address generation into your products.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <KeyRound className="text-amber-300" />
                  <p className="mt-3 font-semibold text-white">API key access</p>
                  <p className="mt-2 text-sm text-stone-300">Generate and rotate production keys for address services.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <BarChart3 className="text-sky-300" />
                  <p className="mt-3 font-semibold text-white">Usage tracking</p>
                  <p className="mt-2 text-sm text-stone-300">Monitor request volume, plan limits, and remaining requests every month.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <FileText className="text-emerald-300" />
                  <p className="mt-3 font-semibold text-white">Search-ready docs</p>
                  <p className="mt-2 text-sm text-stone-300">Use PPOINNT search endpoints immediately with your developer key.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-xl shadow-black/20">
              <div className="flex gap-3">
                <button onClick={() => setMode('register')} className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-stone-950 text-white' : 'bg-stone-100 text-stone-700'}`}>Create account</button>
                <button onClick={() => setMode('login')} className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-stone-950 text-white' : 'bg-stone-100 text-stone-700'}`}>Login</button>
              </div>

              {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
              {notice && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}

              {mode === 'register' ? (
                <form onSubmit={submitRegistration} className="mt-6 space-y-4">
                  <input value={registerForm.companyName} onChange={(event) => setRegisterForm({ ...registerForm, companyName: event.target.value })} className={inputClassName} placeholder="Company Name" />
                  <input value={registerForm.website} onChange={(event) => setRegisterForm({ ...registerForm, website: event.target.value })} className={inputClassName} placeholder="Website" />
                  <input value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} className={inputClassName} placeholder="Email" />
                  <input type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} className={inputClassName} placeholder="Password" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <select value={registerForm.planSlug} onChange={(event) => setRegisterForm({ ...registerForm, planSlug: event.target.value })} className={selectClassName} disabled={plansLoading || !plans.length}>
                      <option value="">{plansLoading ? 'Loading plans...' : 'Select plan'}</option>
                      {plans.map((plan) => <option key={plan.slug || plan.name} value={plan.slug}>{plan.name} • {formatLimitLabel(plan.request_limit ?? plan.limit ?? null)}</option>)}
                    </select>
                    <select value={registerForm.billingCountry} onChange={(event) => setRegisterForm({ ...registerForm, billingCountry: event.target.value })} className={selectClassName} disabled={!countries.length}>
                      <option value="">Select country</option>
                      {countries.map((country) => <option key={country.id} value={country.code}>{country.name}</option>)}
                    </select>
                  </div>
                  <button disabled={loading} className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Processing...' : 'Create Developer Account'}</button>
                </form>
              ) : (
                <>
                  <form onSubmit={submitLogin} className="mt-6 space-y-4">
                    <input value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} className={inputClassName} placeholder="Email" />
                    <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className={inputClassName} placeholder="Password" />
                    <button disabled={loading} className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Signing in...' : 'Login to Developer Dashboard'}</button>
                  </form>
                  <button onClick={() => setShowForgotPassword((current) => !current)} className="mt-4 text-sm font-semibold text-amber-700 underline underline-offset-4">Forgot Password?</button>
                  {showForgotPassword && (
                    <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
                      <form onSubmit={submitForgotPassword} className="space-y-4">
                        <h2 className="text-lg font-bold text-stone-950">Developer Forgot Password</h2>
                        <input value={forgotPasswordEmail} onChange={(event) => setForgotPasswordEmail(event.target.value)} className={inputClassName} placeholder="Developer email" />
                        <button disabled={loading} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50">Send Reset Link</button>
                      </form>
                      <form onSubmit={submitResetPassword} className="mt-6 space-y-4">
                        <h3 className="text-base font-bold text-stone-950">Reset Password</h3>
                        <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} className={inputClassName} placeholder="Reset token" />
                        <input type="password" value={resetPasswordValue} onChange={(event) => setResetPasswordValue(event.target.value)} className={inputClassName} placeholder="New password" />
                        <button disabled={loading} className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">Set New Password</button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.slug || plan.name} className={`rounded-[1.75rem] border p-6 ${registerForm.planSlug === plan.slug ? 'border-amber-300/50 bg-amber-300/10' : 'border-white/10 bg-white/6'}`}>
                <p className="text-sm uppercase tracking-[0.3em] text-stone-300">{plan.name}</p>
                <h3 className="mt-3 text-3xl font-black text-white">{formatPrice(plan)}</h3>
                <p className="mt-2 text-sm text-stone-300">{formatLimitLabel(plan.request_limit ?? plan.limit ?? null)} / month</p>
                <p className="mt-4 text-sm leading-7 text-stone-200">{plan.description}</p>
                <button onClick={() => setRegisterForm({ ...registerForm, planSlug: plan.slug })} className="mt-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">Choose {plan.name}</button>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Developer Dashboard</p>
                <h2 className="mt-2 text-3xl font-black text-stone-950">{dashboard.developer.company_name}</h2>
                <p className="mt-2 text-stone-600">{dashboard.developer.plan_name} • {dashboard.developer.status} • {dashboard.developer.developer_id}</p>
              </div>
              <button onClick={logoutDeveloper} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700">Logout</button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {dashboardTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? 'bg-stone-950 text-white' : 'bg-stone-100 text-stone-700'}`}>
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}

          {activeTab === 'dashboard' && (
            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.5rem] bg-white p-6 text-stone-900 shadow-xl shadow-black/10">
                    <p className="text-sm text-stone-500">Usage This Month</p>
                    <p className="mt-3 text-3xl font-black text-stone-950">{dashboard.usage.request_count.toLocaleString()} / {formatLimitValue(dashboard.usage.request_limit)}</p>
                    <p className="mt-2 text-sm text-stone-500">{formatMonthLabel(dashboard.usage.month)}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-white p-6 text-stone-900 shadow-xl shadow-black/10">
                    <p className="text-sm text-stone-500">Remaining Requests</p>
                    <p className="mt-3 text-3xl font-black text-stone-950">{formatLimitValue(dashboard.usage.remaining_requests)}</p>
                    <p className="mt-2 text-sm text-stone-500">Requests left this month</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-white p-6 text-stone-900 shadow-xl shadow-black/10">
                    <p className="text-sm text-stone-500">Current Plan</p>
                    <p className="mt-3 text-3xl font-black text-stone-950">{dashboard.developer.plan_name}</p>
                    <p className="mt-2 text-sm text-stone-500">Developer ID: {dashboard.developer.developer_id}</p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-xl shadow-black/20">
                  <h3 className="text-2xl font-black text-stone-950">Developer Summary</h3>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm text-stone-500">API Key</p>
                      <p className="mt-2 break-all font-mono text-sm text-stone-900">{dashboard.developer.api_key}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm text-stone-500">Joined</p>
                      <p className="mt-2 text-lg font-semibold text-stone-900">{new Date(dashboard.developer.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: 'numeric' })}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm text-stone-500">Developer ID</p>
                      <p className="mt-2 text-lg font-semibold text-stone-900">{dashboard.developer.developer_id}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm text-stone-500">Request Limit</p>
                      <p className="mt-2 text-lg font-semibold text-stone-900">{formatLimitLabel(dashboard.usage.request_limit)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-xl shadow-black/20">
                  <h3 className="text-2xl font-black text-stone-950">Support Contacts</h3>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm text-stone-500">Support Email</p>
                      <p className="mt-2 text-lg font-semibold text-stone-900">{dashboard.support_contacts?.support_email || 'Not configured'}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm text-stone-500">Business Email</p>
                      <p className="mt-2 text-lg font-semibold text-stone-900">{dashboard.support_contacts?.business_email || 'Not configured'}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm text-stone-500">Support Phone</p>
                      <p className="mt-2 text-lg font-semibold text-stone-900">{dashboard.support_contacts?.support_phone_number || 'Not configured'}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm text-stone-500">Emergency Contact</p>
                      <p className="mt-2 text-lg font-semibold text-stone-900">{dashboard.support_contacts?.emergency_contact_number || 'Not configured'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white">API Reference</h3>
                <p className="mt-3 text-sm leading-7 text-stone-300">PPOINNT High-Performance Logistics & Mapping API.</p>

                <div className="mt-5 space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Address Resolution</p>
                    <p className="mt-2 font-mono text-xs text-stone-200">GET {dashboard.documentation.resolve_endpoint}</p>
                    <p className="mt-1 text-xs text-stone-400">Fetch coordinates, confidence, and entrance points in &lt;200ms.</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Bulk Conversion</p>
                    <p className="mt-2 font-mono text-xs text-stone-200">POST {dashboard.documentation.bulk_endpoint}</p>
                    <p className="mt-1 text-xs text-stone-400">Batch geocode text addresses into PPOINNT codes.</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Routing Engine</p>
                    <p className="mt-2 font-mono text-xs text-stone-200">POST {dashboard.documentation.route_endpoint}</p>
                    <p className="mt-1 text-xs text-stone-400">Calculate routes with turn-by-turn steps & ETAs for Africa.</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">Example JSON Response</p>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-[10px] text-stone-300 font-mono">
                      {JSON.stringify(dashboard.documentation.response_example, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Usage Identity</p>
                  <p className="mt-2 text-xs text-stone-300">Tracking against developer {dashboard.developer.developer_id}.</p>
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-xl shadow-black/20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-stone-950">API Keys</h3>
                  <p className="mt-2 text-sm text-stone-600">Use this key to authenticate every developer API request.</p>
                </div>
                <button disabled={loading} onClick={regenerateApiKey} className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50"><RefreshCw size={16} /> Generate New API Key</button>
              </div>
              <div className="mt-6 rounded-2xl bg-stone-50 p-5">
                <p className="text-sm text-stone-500">API Key</p>
                <p className="mt-3 break-all font-mono text-sm text-stone-900">{dashboard.developer.api_key}</p>
              </div>
              <div className="mt-6 rounded-2xl border border-stone-200 p-5">
                <p className="font-semibold text-stone-900">Authorization Header</p>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-stone-950 p-4 text-sm text-stone-100">Authorization: Bearer {dashboard.developer.api_key}</pre>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-xl shadow-black/20">
              <h3 className="text-2xl font-black text-stone-950">API Usage</h3>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-stone-50 p-5">
                  <p className="text-sm text-stone-500">Requests Used</p>
                  <p className="mt-3 text-3xl font-black text-stone-950">{dashboard.usage.request_count.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-5">
                  <p className="text-sm text-stone-500">Request Limit</p>
                  <p className="mt-3 text-3xl font-black text-stone-950">{formatLimitValue(dashboard.usage.request_limit)}</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-5">
                  <p className="text-sm text-stone-500">Remaining Requests</p>
                  <p className="mt-3 text-3xl font-black text-stone-950">{formatLimitValue(dashboard.usage.remaining_requests)}</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-stone-200 p-5">
                <p className="font-semibold text-stone-900">Usage Window</p>
                <p className="mt-2 text-stone-600">{formatMonthLabel(dashboard.usage.month)}</p>
                <p className="mt-2 text-stone-600">Utilization: {dashboard.usage.usage_percent}%</p>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-xl shadow-black/20">
              <h3 className="text-2xl font-black text-stone-950">Current Subscription Plan</h3>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 p-5">
                  <p className="text-sm text-stone-500">Plan</p>
                  <p className="mt-3 text-3xl font-black text-stone-950">{dashboard.plan?.name || dashboard.developer.plan_name}</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-5">
                  <p className="text-sm text-stone-500">Request Limit</p>
                  <p className="mt-3 text-3xl font-black text-stone-950">{formatLimitValue(dashboard.plan?.request_limit ?? dashboard.usage.request_limit)}</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-stone-200 p-5">
                <p className="font-semibold text-stone-900">Description</p>
                <p className="mt-2 text-stone-600">{dashboard.plan?.description || 'No plan description available.'}</p>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
              <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-xl shadow-black/20">
                <h3 className="text-2xl font-black text-stone-950">Billing</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">Submit payment proof for plan upgrades and track payment history here.</p>
                <form onSubmit={submitPayment} className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <select value={paymentForm.planSlug} onChange={(event) => setPaymentForm({ ...paymentForm, planSlug: event.target.value })} className={selectClassName}>
                      {plans.filter((plan) => plan.slug !== 'starter').map((plan) => <option key={plan.slug} value={plan.slug}>{plan.name}</option>)}
                    </select>
                    <select value={paymentForm.paymentMethod} onChange={(event) => setPaymentForm({ ...paymentForm, paymentMethod: event.target.value })} className={selectClassName}>
                      {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                    </select>
                  </div>
                  <input value={paymentForm.proofReference} onChange={(event) => setPaymentForm({ ...paymentForm, proofReference: event.target.value })} className={inputClassName} placeholder="Payment reference or narration" />
                  <input type="file" onChange={handleProofFile} className={inputClassName} />
                  <button disabled={loading} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50">Submit Payment Proof</button>
                </form>

                <div className="mt-6 space-y-3">
                  {(dashboard.payments || []).map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-stone-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-stone-900">{payment.plan_name}</p>
                          <p className="text-sm text-stone-500">{payment.payment_method} • {payment.currency} {payment.amount}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : payment.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{payment.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white">Bank Transfer Details</h3>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-200">
                  <p>{dashboard.payment_settings?.bank_transfer_details?.bank_name}</p>
                  <p>{dashboard.payment_settings?.bank_transfer_details?.account_name}</p>
                  <p>{dashboard.payment_settings?.bank_transfer_details?.account_number}</p>
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-xl shadow-black/20">
              <h3 className="text-2xl font-black text-stone-950">Account Settings</h3>
              <form onSubmit={saveAccountSettings} className="mt-6 grid gap-4 md:grid-cols-2">
                <input value={accountForm.companyName} onChange={(event) => setAccountForm((previous) => ({ ...previous, companyName: event.target.value }))} className={inputClassName} placeholder="Company Name" />
                <input value={accountForm.email} onChange={(event) => setAccountForm((previous) => ({ ...previous, email: event.target.value }))} className={inputClassName} placeholder="Email" />
                <input value={accountForm.website} onChange={(event) => setAccountForm((previous) => ({ ...previous, website: event.target.value }))} className={inputClassName} placeholder="Website" />
                <input type="password" value={accountForm.password} onChange={(event) => setAccountForm((previous) => ({ ...previous, password: event.target.value }))} className={inputClassName} placeholder="New password (optional)" />
                <div className="rounded-2xl bg-stone-50 p-5">
                  <p className="text-sm text-stone-500">Joined</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{new Date(dashboard.developer.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: 'numeric' })}</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-5">
                  <p className="text-sm text-stone-500">Developer ID</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{dashboard.developer.developer_id}</p>
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button disabled={loading} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>

              <div className="mt-6 rounded-2xl border border-stone-200 p-5">
                <p className="font-semibold text-stone-900">Support</p>
                <p className="mt-2 text-stone-600">{dashboard.support_contacts?.support_email || 'Not configured'} • {dashboard.support_contacts?.support_phone_number || 'Not configured'}</p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
