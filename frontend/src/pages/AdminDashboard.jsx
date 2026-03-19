import { Fragment, useEffect, useMemo, useState } from 'react';
import { PLACE_TYPES } from '../constants/placeTypes';
import { Link, useNavigate } from 'react-router-dom';
import { CircleMarker, MapContainer, Polygon, Popup, TileLayer } from 'react-leaflet';
import { BarChart3, Building2, CreditCard, Globe, KeyRound, MapPinned, Settings2, ShieldAlert, ShieldCheck, Truck, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const tabs = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'addresses', label: 'Addresses', icon: MapPinned },
  { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'developers', label: 'Developers', icon: Building2 },
  { id: 'usage', label: 'API Usage', icon: BarChart3 },
  { id: 'plans', label: 'Subscription Plans', icon: CreditCard },
  { id: 'payments', label: 'Payments', icon: KeyRound },
  { id: 'regions', label: 'Regions', icon: Globe },
  { id: 'registry', label: 'Registry', icon: MapPinned },
  { id: 'dispatch', label: 'Dispatch', icon: Truck },
  { id: 'settings', label: 'System Settings', icon: Settings2 },
];

const rolePermissions = {
  'Super Admin': ['overview', 'addresses', 'moderation', 'businesses', 'agents', 'developers', 'usage', 'plans', 'payments', 'regions', 'registry', 'dispatch', 'settings'],
  'Admin': ['overview', 'addresses', 'moderation', 'businesses', 'agents', 'regions', 'registry', 'dispatch'],
  'Manager': ['overview', 'addresses', 'moderation', 'businesses', 'agents', 'regions', 'registry', 'dispatch'],
  'Field Officer': ['addresses', 'agents', 'regions', 'dispatch'],
};

const regionLevels = [
  { id: 'country', label: 'Countries' },
  { id: 'state', label: 'States' },
  { id: 'city', label: 'Cities' },
];

const regionTabCopy = {
  country: {
    title: 'Countries',
    emptyState: 'No countries available.',
    helper: 'Tick one or more countries to unlock the state checkbox list.',
  },
  state: {
    title: 'States',
    emptyState: 'Select one or more countries in the Countries tab to load state checkboxes.',
    helper: 'Tick one or more states to unlock the city checkbox list.',
  },
  city: {
    title: 'Cities',
    emptyState: 'Select one or more states in the States tab to load city checkboxes.',
    helper: 'Choose the cities you want to enable or disable in bulk.',
  },
};

const initialLogin = {
  email: 'ibitoyeoluwasegunemmanuel@gmail.com',
  password: 'PPOINNTAdmin@2026',
};

const initialStaffForm = {
  fullName: '',
  email: '',
  role: 'Admin',
  regionLevel: 'country',
  regionId: '',
  isEnabled: true,
};

const initialPlanForm = {
  name: '',
  slug: '',
  description: '',
  price_ngn: 0,
  price_usd: 0,
  request_limit: 0,
};

const inputClassName = 'w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 shadow-sm outline-none';
const selectClassName = 'w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 shadow-sm outline-none';
const selectStyle = { colorScheme: 'light' };
const formatLimitValue = (value) => (value === null || value === 'Unlimited' ? 'Unlimited' : Number(value || 0).toLocaleString());
const defaultModeration = { reported_addresses: [], suspicious_activity: [], low_confidence_addresses: [], unverified_buildings: [], pending_business_verification: [] };
const adminMapCategoryStyle = {
  verified: { color: '#15803d', fillColor: '#22c55e' },
  low_confidence: { color: '#b45309', fillColor: '#f59e0b' },
  unverified_building: { color: '#6b7280', fillColor: '#9ca3af' },
};
const defaultAdminMapCenter = [6.5244, 3.3792];

const initialBuildingDetectionForm = {
  cityCode: '',
  limit: 20,
  radiusMeters: 1200,
};

const readStoredAdmin = () => {
  try {
    return JSON.parse(localStorage.getItem('ppoint_admin_profile') || 'null');
  } catch {
    return null;
  }
};

const ensureArray = (value) => Array.isArray(value) ? value : [];

const ensureObject = (value, fallback = {}) => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
);

const hasValidCoordinate = (item) => Number.isFinite(Number(item?.latitude)) && Number.isFinite(Number(item?.longitude));

const getErrorMessage = (error, fallbackMessage) => error?.response?.data?.error || error?.response?.data?.message || fallbackMessage;

export default function AdminDashboard() {
  const navigate = useNavigate();
  // Defensive: Only access localStorage in browser
  const getInitialToken = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('ppoint_admin_session') || '';
    }
    return '';
  };
  const [token, setToken] = useState(getInitialToken);
  const [adminProfile, setAdminProfile] = useState(readStoredAdmin);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('ibitoyeoluwasegunemmanuel@gmail.com');
  const [resetToken, setResetToken] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [adminMapData, setAdminMapData] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [agents, setAgents] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [usage, setUsage] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [moderation, setModeration] = useState(defaultModeration);
  const [registry, setRegistry] = useState([]);
  const [dispatch, setDispatch] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [staff, setStaff] = useState([]);
  const [addressQuery, setAddressQuery] = useState('');
  const [registryQuery, setRegistryQuery] = useState('');
  const [activeRegionLevel, setActiveRegionLevel] = useState('country');
  const [selectedRegionIds, setSelectedRegionIds] = useState({ country: [], state: [], city: [] });
  const [staffForm, setStaffForm] = useState(initialStaffForm);
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [buildingDetectionForm, setBuildingDetectionForm] = useState(initialBuildingDetectionForm);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scriptError, setScriptError] = useState(null);
  // Device detection for UI tweaks
  const [deviceType, setDeviceType] = useState('desktop');
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad|Tablet/i.test(ua)) setDeviceType('mobile');
    else setDeviceType('desktop');
    // Global error handler for JS failures
    window.onerror = (msg, url, line, col, err) => {
      setScriptError(`${msg} at ${url}:${line}:${col}`);
      setLoading(false);
      setError('A script error occurred. Please reload or contact support.');
      return false;
    };
    window.onunhandledrejection = (event) => {
      setScriptError(event.reason?.message || 'Unhandled promise rejection');
      setLoading(false);
      setError('A script error occurred. Please reload or contact support.');
    };
    return () => {
      window.onerror = null;
      window.onunhandledrejection = null;
    };
  }, []);

  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  // Robust permissions check: handle missing/malformed adminProfile
  const permissions = adminProfile?.permissions || (adminProfile?.role && rolePermissions[adminProfile.role]) || [];
  const visibleTabs = Array.isArray(permissions) ? tabs.filter((tab) => permissions.includes(tab.id)) : [];
  // Fallback UI for missing/invalid/malformed adminProfile after login
  if (token && (!adminProfile || typeof adminProfile !== 'object' || !adminProfile.role)) {
    return (
      <div className="text-red-500 p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Admin profile is missing, invalid, or incomplete</h2>
        <p className="mb-4">Your session may have expired, there was a login error, or your admin profile is malformed.<br/>Please log in again. If this persists, contact support.</p>
        <div className="mb-2 text-xs text-stone-400">[Debug] Token: {JSON.stringify(token)}</div>
        <pre className="bg-red-100 text-red-700 rounded p-2 text-xs overflow-x-auto max-w-xl mx-auto mb-4" style={{textAlign:'left'}}>
          {JSON.stringify(adminProfile, null, 2)}
        </pre>
        <button
          className="rounded-full bg-stone-950 px-5 py-3 font-semibold text-white"
          onClick={() => {
            localStorage.removeItem('ppoint_admin_session');
            localStorage.removeItem('ppoint_admin_profile');
            setToken('');
            setAdminProfile(null);
          }}
        >Logout</button>
      </div>
    );
  }
  // Fallback UI for critical dashboard data load failure
  if (token && adminProfile && (!Array.isArray(visibleTabs) || visibleTabs.length === 0)) {
    return (
      <div className="text-red-500 p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Dashboard failed to load</h2>
        <p className="mb-4">No admin tabs are available. This may be due to a malformed profile, missing permissions, or a backend error.</p>
        <div className="mb-2 text-xs text-stone-400">[Debug] Token: {JSON.stringify(token)}</div>
        <pre className="bg-red-100 text-red-700 rounded p-2 text-xs overflow-x-auto max-w-xl mx-auto mb-4" style={{textAlign:'left'}}>
          {JSON.stringify(adminProfile, null, 2)}
        </pre>
        <button
          className="rounded-full bg-stone-950 px-5 py-3 font-semibold text-white"
          onClick={() => {
            localStorage.removeItem('ppoint_admin_session');
            localStorage.removeItem('ppoint_admin_profile');
            setToken('');
            setAdminProfile(null);
          }}
        >Logout</button>
      </div>
    );
  }
  // Debug: log adminProfile and visibleTabs for troubleshooting blank screens
  useEffect(() => {
    if (token) {
      // eslint-disable-next-line no-console
      console.log('AdminDashboard debug:', { adminProfile, visibleTabs });
    }
  }, [token, adminProfile, visibleTabs]);

  const availableStates = useMemo(() => {
    const selectedCountryIds = selectedRegionIds.country || [];

    if (!selectedCountryIds.length) {
      return [];
    }

    return states.filter((state) => selectedCountryIds.includes(state.country_id));
  }, [states, selectedRegionIds.country]);

  const availableCities = useMemo(() => {
    const selectedStateIds = selectedRegionIds.state || [];

    if (!selectedStateIds.length) {
      return [];
    }

    return cities.filter((city) => selectedStateIds.includes(city.state_id));
  }, [cities, selectedRegionIds.state]);

  const regionItems = useMemo(() => ({
    country: countries,
    state: availableStates,
    city: availableCities,
  }), [countries, availableStates, availableCities]);

  const currentRegionItems = regionItems[activeRegionLevel] || [];
  const currentSelectedIds = selectedRegionIds[activeRegionLevel] || [];
  const allCurrentSelected = Boolean(currentRegionItems.length) && currentRegionItems.every((item) => currentSelectedIds.includes(item.id));
  const currentRegionMeta = regionTabCopy[activeRegionLevel];
  const hasCurrentSelection = currentSelectedIds.length > 0;
  const sanitizedAdminMapData = useMemo(() => adminMapData.filter(hasValidCoordinate), [adminMapData]);
  const adminMapCenter = useMemo(() => {
    const firstItem = sanitizedAdminMapData[0];
    return firstItem ? [Number(firstItem.latitude), Number(firstItem.longitude)] : defaultAdminMapCenter;
  }, [sanitizedAdminMapData]);
  const lowConfidenceCount = useMemo(() => addresses.filter((item) => Number(item.confidence_score || 0) < 60).length, [addresses]);

  const loadRegions = async () => {
    const response = await api.get('/regions', { headers });
    const data = response.data.data || {};

    setCountries(data.countries || []);
    setStates(data.states || []);
    setCities(data.cities || []);
  };

  const loadAdminData = async (searchTerm = addressQuery) => {
    const requestEntries = [
      ['overview', api.get('/admin/overview', { headers })],
      ['addresses', api.get('/admin/addresses', { headers, params: { q: searchTerm } })],
      ['map', api.get('/admin/map', { headers })],
      ['moderation', api.get('/admin/moderation', { headers })],
      ['businesses', api.get('/admin/businesses', { headers })],
      ['agents', api.get('/admin/agents', { headers })],
      ['developers', api.get('/admin/developers', { headers })],
      ['usage', api.get('/admin/api-usage', { headers })],
      ['plans', api.get('/admin/plans', { headers })],
      ['payments', api.get('/admin/payments', { headers })],
      ['settings', api.get('/admin/settings', { headers })],
      ['registry', api.get('/admin/registry', { headers, params: { q: registryQuery } })],
      ['dispatch', api.get('/admin/dispatch', { headers })],
      ['staff', api.get('/admin/staff', { headers })],
    ];
    const settledResults = await Promise.allSettled(requestEntries.map(([, request]) => request));
    const resultMap = Object.fromEntries(settledResults.map((result, index) => [requestEntries[index][0], result]));
    const failures = settledResults.filter((result) => result.status === 'rejected');

    if (resultMap.overview?.status === 'fulfilled') {
      setOverview(ensureObject(resultMap.overview.value.data?.data, null));
    }

    if (resultMap.addresses?.status === 'fulfilled') {
      setAddresses(ensureArray(resultMap.addresses.value.data?.data));
    } else {
      setAddresses([]);
    }

    if (resultMap.map?.status === 'fulfilled') {
      setAdminMapData(ensureArray(resultMap.map.value.data?.data));
    } else {
      setAdminMapData([]);
    }

    if (resultMap.moderation?.status === 'fulfilled') {
      setModeration({ ...defaultModeration, ...ensureObject(resultMap.moderation.value.data?.data) });
    } else {
      setModeration(defaultModeration);
    }

    setBusinesses(resultMap.businesses?.status === 'fulfilled' ? ensureArray(resultMap.businesses.value.data?.data) : []);
    setAgents(resultMap.agents?.status === 'fulfilled' ? ensureArray(resultMap.agents.value.data?.data) : []);
    setDevelopers(resultMap.developers?.status === 'fulfilled' ? ensureArray(resultMap.developers.value.data?.data) : []);
    setUsage(resultMap.usage?.status === 'fulfilled' ? ensureArray(resultMap.usage.value.data?.data) : []);
    setPlans(resultMap.plans?.status === 'fulfilled' ? ensureArray(resultMap.plans.value.data?.data) : []);
    setPayments(resultMap.payments?.status === 'fulfilled' ? ensureArray(resultMap.payments.value.data?.data) : []);
    setSettings(resultMap.settings?.status === 'fulfilled' ? ensureObject(resultMap.settings.value.data?.data, null) : null);
    setRegistry(resultMap.registry?.status === 'fulfilled' ? ensureArray(resultMap.registry.value.data?.data) : []);
    setDispatch(resultMap.dispatch?.status === 'fulfilled' ? ensureObject(resultMap.dispatch.value.data?.data, null) : null);
    setStaff(resultMap.staff?.status === 'fulfilled' ? ensureArray(resultMap.staff.value.data?.data) : []);

    try {
      await loadRegions();
    } catch {
      setCountries([]);
      setStates([]);
      setCities([]);
    }

    if (failures.length) {
      throw failures[0].reason;
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoading(true);
    loadAdminData().catch((loadError) => {
      const status = loadError?.response?.status;
      setError(getErrorMessage(loadError, 'Failed to load admin dashboard. Some admin modules may be unavailable.'));
      if (status === 401 || status === 403) {
        localStorage.removeItem('ppoint_admin_session');
        localStorage.removeItem('ppoint_admin_profile');
        setToken('');
        setAdminProfile(null);
      }
    }).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!visibleTabs.length) {
      return;
    }

    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  useEffect(() => {
    setSelectedRegionIds((previous) => {
      const validStateIds = states
        .filter((state) => previous.country.includes(state.country_id))
        .map((state) => state.id);
      const nextStateIds = previous.state.filter((stateId) => validStateIds.includes(stateId));
      const validCityIds = cities
        .filter((city) => nextStateIds.includes(city.state_id))
        .map((city) => city.id);
      const nextCityIds = previous.city.filter((cityId) => validCityIds.includes(cityId));

      if (nextStateIds.length === previous.state.length && nextCityIds.length === previous.city.length) {
        return previous;
      }

      return {
        ...previous,
        state: nextStateIds,
        city: nextCityIds,
      };
    });
  }, [states, cities, selectedRegionIds.country]);

  useEffect(() => {
    setSelectedRegionIds((previous) => {
      const validCityIds = cities
        .filter((city) => previous.state.includes(city.state_id))
        .map((city) => city.id);
      const nextCityIds = previous.city.filter((cityId) => validCityIds.includes(cityId));

      if (nextCityIds.length === previous.city.length) {
        return previous;
      }

      return {
        ...previous,
        city: nextCityIds,
      };
    });
  }, [cities, selectedRegionIds.state]);

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    setScriptError(null);
    try {
      const response = await api.post('/admin/auth/login', loginForm);
      const nextToken = response.data.data.token;
      const nextAdmin = response.data.data.admin;
      // Store token in localStorage
      localStorage.setItem('ppoint_admin_session', nextToken);
      localStorage.setItem('ppoint_admin_profile', JSON.stringify(nextAdmin));
      // Store token in cookie (fallback for mobile)
      document.cookie = `ppoint_admin_session=${nextToken}; path=/; SameSite=Lax; max-age=86400`;
      setToken(nextToken);
      setAdminProfile(nextAdmin);
      setNotice('Admin session established.');
      // Only redirect after token is set and verified
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 100);
    } catch (loginError) {
      setError(loginError.response?.data?.error || 'Invalid admin email or password.');
      // Redirect to login with error
      setTimeout(() => {
        navigate('/admin/login', { replace: true, state: { error: loginError.response?.data?.error || 'Authentication failed.' } });
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.post('/auth/forgot-password', { email: forgotPasswordEmail });
      setResetToken(response.data.reset_token || '');
      setNotice(`Reset token created. Use this token to complete password reset: ${response.data.reset_token}`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to create password reset token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await api.post('/auth/reset-password', { token: resetToken, password: resetPasswordValue });
      setNotice(response.data.message || 'Password reset successful.');
      setShowForgotPassword(false);
      setLoginForm((previous) => ({ ...previous, password: resetPasswordValue }));
      setResetPasswordValue('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAddressStatus = async (address) => {
    try {
      await api.patch(`/admin/addresses/${address.id}/status`, { isActive: address.is_active === false }, { headers });
      await loadAdminData();
      setNotice('Address status updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to update address status.');
    }
  };

  const updateAddressField = (addressId, field, value) => {
    setAddresses((previous) => previous.map((address) => (
      address.id === addressId ? { ...address, [field]: value } : address
    )));
  };

  const saveAddressRecord = async (address, overrides = {}) => {
    try {
      await api.patch(`/admin/addresses/${address.id}`, {
        buildingName: overrides.building_name ?? address.building_name,
        houseNumber: overrides.house_number ?? address.house_number,
        streetName: overrides.street_name ?? address.street_name,
        communityName: overrides.community_name ?? address.community_name,
        landmark: overrides.landmark ?? address.landmark,
        streetDescription: overrides.street_description ?? address.street_description ?? address.description,
        description: overrides.description ?? address.description,
        district: overrides.district ?? address.district,
        buildingPolygonId: overrides.building_polygon_id ?? address.building_polygon_id,
        phoneNumber: overrides.phone_number ?? address.phone_number,
        entranceLabel: overrides.entrance_label ?? address.entrance_label,
        entranceLatitude: overrides.entrance_latitude ?? address.entrance_latitude,
        entranceLongitude: overrides.entrance_longitude ?? address.entrance_longitude,
        confidenceScore: overrides.confidence_score ?? address.confidence_score,
        autoGeneratedFlag: overrides.auto_generated_flag ?? address.auto_generated_flag,
        placeType: overrides.place_type ?? address.place_type,
        customPlaceType: overrides.custom_place_type ?? address.custom_place_type,
        addressMetadata: overrides.address_metadata ?? address.address_metadata,
        addressType: overrides.address_type ?? address.address_type,
        moderationStatus: overrides.moderation_status ?? address.moderation_status,
        isActive: overrides.is_active ?? address.is_active !== false,
      }, { headers });
      await loadAdminData();
      setNotice('Address updated successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to update address.');
    }
  };

  const deleteAddressRecord = async (addressId) => {
    try {
      await api.delete(`/admin/addresses/${addressId}`, { headers });
      await loadAdminData();
      setNotice('Address deleted successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to delete address.');
    }
  };

  const runBuildingDetection = async () => {
    try {
      await api.post('/admin/building-detections/run', buildingDetectionForm, { headers });
      await loadAdminData();
      setNotice('Auto building detection completed and synced to Admin.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to run building detection.');
    }
  };

  const reviewBusiness = async (businessId, status) => {
    try {
      await api.patch(`/admin/businesses/${businessId}/status`, { status }, { headers });
      await loadAdminData();
      setNotice(`Business ${status} successfully.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update business status.');
    }
  };

  const changeDeveloperStatus = async (developerId, status) => {
    try {
      await api.patch(`/admin/developers/${developerId}/status`, { status }, { headers });
      await loadAdminData();
      setNotice('Developer status updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to update developer status.');
    }
  };

  const changeDeveloperPlan = async (developerId, planSlug) => {
    try {
      await api.patch(`/admin/developers/${developerId}/plan`, { planSlug }, { headers });
      await loadAdminData();
      setNotice('Developer plan updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to update developer plan.');
    }
  };

  const resetDeveloperUsage = async (developerId) => {
    try {
      await api.post(`/admin/developers/${developerId}/reset-usage`, {}, { headers });
      await loadAdminData();
      setNotice('Developer usage reset.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to reset developer usage.');
    }
  };

  const resetDeveloperKey = async (developerId) => {
    try {
      await api.post(`/admin/developers/${developerId}/reset-api-key`, {}, { headers });
      await loadAdminData();
      setNotice('Developer API key reset.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to reset API key.');
    }
  };

  const savePlan = async (plan) => {
    try {
      await api.patch(`/admin/plans/${plan.id}`, plan, { headers });
      await loadAdminData();
      setNotice('Subscription plan updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to update plan.');
    }
  };

  const createPlan = async () => {
    try {
      await api.post('/admin/plans', planForm, { headers });
      setPlanForm(initialPlanForm);
      await loadAdminData();
      setNotice('Subscription plan created.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to create plan.');
    }
  };

  const archivePlan = async (planId) => {
    try {
      await api.delete(`/admin/plans/${planId}`, { headers });
      await loadAdminData();
      setNotice('Subscription plan archived.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to archive plan.');
    }
  };

  const reviewPayment = async (paymentId, status) => {
    try {
      await api.patch(`/admin/payments/${paymentId}`, { status }, { headers });
      await loadAdminData();
      setNotice('Payment status updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to update payment.');
    }
  };

  const saveSettings = async () => {
    try {
      const response = await api.post('/admin/settings', settings, { headers });
      setSettings(response.data.data);
      await loadAdminData();
      setNotice(response.data.message || 'System settings saved successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to save settings.');
    }
  };

  const updateRegistryField = (registryId, field, value) => {
    setRegistry((previous) => previous.map((item) => (
      item.id === registryId ? { ...item, [field]: value } : item
    )));
  };

  const saveRegistryRecord = async (record) => {
    try {
      await api.patch(`/admin/registry/${record.id}`, record, { headers });
      await loadAdminData();
      setNotice('Registry record updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to update registry record.');
    }
  };

  const exportRegistry = async () => {
    try {
      const response = await api.get('/admin/registry/export', { headers, params: { q: registryQuery } });
      const count = response.data.data?.length || 0;
      setNotice(`Registry export prepared with ${count} records.`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to export registry.');
    }
  };

  const toggleRegionSelection = (level, id) => {
    setSelectedRegionIds((previous) => ({
      ...previous,
      [level]: previous[level].includes(id)
        ? previous[level].filter((itemId) => itemId !== id)
        : [...previous[level], id],
    }));
  };

  const toggleSelectAllForCurrentLevel = (checked) => {
    setSelectedRegionIds((previous) => ({
      ...previous,
      [activeRegionLevel]: checked ? currentRegionItems.map((item) => item.id) : [],
    }));
  };

  const applyRegionAction = async (action) => {
    const regionIds = selectedRegionIds[activeRegionLevel] || [];
    if (!regionIds.length) {
      setError(`Tick one or more ${currentRegionMeta.title.toLowerCase()} checkboxes before running a bulk action.`);
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await api.post(`/regions/${action}`, { level: activeRegionLevel, regionIds }, { headers });
      await loadAdminData();
      setSelectedRegionIds((previous) => ({ ...previous, [activeRegionLevel]: [] }));
      setNotice(`Selected ${currentRegionMeta.title.toLowerCase()} ${action === 'enable' ? 'enabled' : 'disabled'} successfully.`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to update selected regions.');
    }
  };

  const createStaff = async (event) => {
    event.preventDefault();
    try {
      await api.post('/admin/staff', staffForm, { headers });
      setStaffForm(initialStaffForm);
      await loadAdminData();
      setNotice('Staff assigned to region.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to create staff account.');
    }
  };

  if (!token || typeof token !== 'string' || token.length < 10) {
    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.35em] text-amber-600">Admin Login</p>
        <h1 className="mt-4 text-3xl font-black text-stone-950">Platform Control System</h1>
        <p className="mt-3 text-stone-600">Use admin email and password to access addresses, developers, payments, plans, regions, and settings.</p>
        <div className="mt-2 text-xs text-stone-400">[Debug] Token: {JSON.stringify(token)}</div>
        {scriptError && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Script error: {scriptError}</div>}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {typeof error === 'string' ? error : error?.message || JSON.stringify(error)}
          </div>
        )}
        {notice && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}
        {loading && <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">Loading admin dashboard...</div>}
        <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
          <input value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} className={inputClassName} placeholder="Admin Email" />
          <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className={inputClassName} placeholder="Password" />
          <button disabled={loading} className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Authenticating...' : 'Login to Admin Dashboard'}</button>
        </form>
        <button onClick={() => setShowForgotPassword((current) => !current)} className="mt-4 text-sm font-semibold text-amber-700 underline underline-offset-4">Forgot Password?</button>
        {showForgotPassword && (
          <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <h2 className="text-lg font-bold text-stone-950">Forgot Password</h2>
              <input value={forgotPasswordEmail} onChange={(event) => setForgotPasswordEmail(event.target.value)} className={inputClassName} placeholder="Admin email" />
              <button disabled={loading} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white disabled:opacity-50">Send Reset Token</button>
            </form>
            <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
              <h3 className="text-base font-bold text-stone-950">Reset Password</h3>
              <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} className={inputClassName} placeholder="Reset token" />
              <input type="password" value={resetPasswordValue} onChange={(event) => setResetPasswordValue(event.target.value)} className={inputClassName} placeholder="New password" />
              <button disabled={loading} className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">Reset Password</button>
            </form>
          </div>
        )}
        <div className="mt-6 text-xs text-stone-400">Device: {deviceType}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Admin Control System</p>
          <h1 className="mt-3 text-4xl font-black text-white">PPOINT Platform Operations</h1>
          <p className="mt-3 text-stone-300">Control developers, API usage, subscription plans, payments, regions, and system configuration without code changes.</p>
          <p className="mt-2 text-sm text-stone-400">Signed in as {adminProfile?.role || 'Super Admin'}</p>
        </div>
        <button onClick={() => { localStorage.removeItem('ppoint_admin_session'); localStorage.removeItem('ppoint_admin_profile'); setToken(''); setAdminProfile(null); }} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">Logout</button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200/30 bg-red-500/10 p-4 text-sm text-red-100">
          {typeof error === 'string' ? error : error?.message || JSON.stringify(error)}
        </div>
      )}
      {notice && <div className="rounded-2xl border border-emerald-200/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">{notice}</div>}
      {loading && <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">Loading admin data...</div>}

      <div className="flex flex-wrap gap-3">
        {visibleTabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${activeTab === tab.id ? 'bg-white text-stone-950' : 'bg-white/10 text-white'}`}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && overview && (
        <div className="grid gap-5 md:grid-cols-4">
          {[
            ['Total Addresses', overview.total_addresses],
            ['Low Confidence', overview.low_confidence_addresses],
            ['Unverified Buildings', overview.unverified_buildings],
            ['Active Developers', overview.active_developers],
            ['Pending Payments', overview.pending_payments],
            ['Monthly API Requests', overview.monthly_api_requests],
            ['Business Verification', overview.pending_business_verification],
            ['Reported Addresses', overview.reported_addresses],
            ['Suspicious Activity', overview.suspicious_activity],
            ['Active Countries', `${overview.active_countries}/${overview.total_countries}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.75rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/10">
              <p className="text-sm text-stone-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-stone-950">{typeof value === 'number' ? Number(value).toLocaleString() : value}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-stone-950">Generated Addresses</h2>
                <p className="mt-2 text-sm text-stone-600">Code, confidence, community, and building-detection status are synchronized here for admin review.</p>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row">
                <input value={addressQuery} onChange={(event) => setAddressQuery(event.target.value)} className={inputClassName} placeholder="Search addresses, communities, or codes" />
                <button onClick={() => loadAdminData(addressQuery)} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">Search</button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="overflow-hidden rounded-2xl border border-stone-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-stone-50 text-left text-stone-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Code</th>
                        <th className="px-4 py-3 font-semibold">Place Type</th>
                        <th className="px-4 py-3 font-semibold">Community</th>
                        <th className="px-4 py-3 font-semibold">City</th>
                        <th className="px-4 py-3 font-semibold">Confidence</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addresses.map((address) => (
                        <tr key={`table-${address.id}`} className="border-t border-stone-100">
                          <td className="px-4 py-3 font-semibold text-stone-950">{address.ppoint_code || address.code}</td>
                          <td className="px-4 py-3">{address.display_place_type || address.place_type || 'House'}</td>
                          <td className="px-4 py-3">{address.community_name || 'Unknown'}</td>
                          <td className="px-4 py-3">{address.city || address.city_name}</td>
                          <td className="px-4 py-3">{Number(address.confidence_score || 0)}/100</td>
                          <td className="px-4 py-3">{address.moderation_status || 'active'}</td>
                          <td className="px-4 py-3">{address.created_at ? new Date(address.created_at).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <h3 className="text-lg font-bold text-stone-950">AI Building Detection Engine</h3>
                <p className="mt-2 text-sm text-stone-600">Run OSM building footprint detection for a city zone and sync new unverified records into Admin instantly.</p>
                <div className="mt-4 space-y-3">
                  <select value={buildingDetectionForm.cityCode} onChange={(event) => setBuildingDetectionForm((current) => ({ ...current, cityCode: event.target.value }))} className={selectClassName} style={selectStyle}>
                    <option value="">Select city</option>
                    {cities.map((city) => <option key={city.id} value={city.code}>{city.name}</option>)}
                  </select>
                  <input value={buildingDetectionForm.limit} onChange={(event) => setBuildingDetectionForm((current) => ({ ...current, limit: Number(event.target.value) || 1 }))} className={inputClassName} placeholder="Max buildings" />
                  <input value={buildingDetectionForm.radiusMeters} onChange={(event) => setBuildingDetectionForm((current) => ({ ...current, radiusMeters: Number(event.target.value) || 300 }))} className={inputClassName} placeholder="Radius meters" />
                  <button onClick={runBuildingDetection} className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">Run Detection</button>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p>Low-confidence addresses in view: {lowConfidenceCount}</p>
                    <p className="mt-1">Unverified detections on map: {sanitizedAdminMapData.filter((item) => item.category === 'unverified_building').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-stone-950">Admin Map Layer</h3>
                <p className="mt-2 text-sm text-stone-600">Green is verified, amber is low confidence, and grey is unverified building detection.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-emerald-100 px-3 py-2 text-emerald-700">Verified</span>
                <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-700">Low Confidence</span>
                <span className="rounded-full bg-stone-200 px-3 py-2 text-stone-700">Unverified Building</span>
              </div>
            </div>
            <div className="mt-6 h-[420px] overflow-hidden rounded-2xl border border-stone-200">
              <MapContainer center={adminMapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {sanitizedAdminMapData.map((item) => {
                  const categoryStyle = adminMapCategoryStyle[item.category] || adminMapCategoryStyle.verified;
                  const polygonPoints = ensureArray(item.building_polygon)
                    .map((point) => [Number(point.latitude ?? point.lat), Number(point.longitude ?? point.lng)])
                    .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude));

                  return (
                    <Fragment key={`map-${item.id}`}>
                      {polygonPoints.length > 2 && (
                        <Polygon positions={polygonPoints} pathOptions={{ color: categoryStyle.color, fillColor: categoryStyle.fillColor, fillOpacity: 0.22, weight: 1.5 }} />
                      )}
                      <CircleMarker center={[Number(item.latitude), Number(item.longitude)]} radius={6} pathOptions={{ color: categoryStyle.color, fillColor: categoryStyle.fillColor, fillOpacity: 0.85 }}>
                        <Popup>
                          <strong>{item.ppoint_code || item.code}</strong><br />
                          {item.community_name || item.city}<br />
                          Confidence: {Number(item.confidence_score || 0)}/100<br />
                          Status: {item.moderation_status || 'active'}
                        </Popup>
                      </CircleMarker>
                    </Fragment>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-stone-950">{address.ppoint_code || address.code}</p>
                    <p className="mt-1 text-sm text-stone-600">{address.street_name || address.street_description || 'No detected street'} • {address.community_name || 'Unknown community'} • {address.city || address.city_name}, {address.state}, {address.country}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">{address.moderation_status || 'active'} • {address.address_type || 'community'} • Confidence {Number(address.confidence_score || 0)}/100</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/${address.ppoint_code || address.code}`} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-900">View Map</Link>
                    <a href={`https://maps.google.com/?q=${address.latitude},${address.longitude}`} target="_blank" rel="noreferrer" className="rounded-full bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-900">Navigate</a>
                    <button onClick={() => saveAddressRecord(address, { moderation_status: 'active', is_active: true })} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Approve</button>
                    <button onClick={() => saveAddressRecord(address, { moderation_status: 'flagged', is_active: true })} className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">Flag</button>
                    <button onClick={() => deleteAddressRecord(address.id)} className="rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">Delete</button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <input value={address.building_name || ''} onChange={(event) => updateAddressField(address.id, 'building_name', event.target.value)} className={inputClassName} placeholder="Building / Place Name" />
                  <input value={address.community_name || ''} onChange={(event) => updateAddressField(address.id, 'community_name', event.target.value)} className={inputClassName} placeholder="Community" />
                  <input value={address.street_name || ''} onChange={(event) => updateAddressField(address.id, 'street_name', event.target.value)} className={inputClassName} placeholder="Street name" />
                  <input value={address.house_number || ''} onChange={(event) => updateAddressField(address.id, 'house_number', event.target.value)} className={inputClassName} placeholder="House Number" />
                  <input value={address.entrance_label || ''} onChange={(event) => updateAddressField(address.id, 'entrance_label', event.target.value)} className={inputClassName} placeholder="Entrance label" />
                  <input value={address.confidence_score || 0} onChange={(event) => updateAddressField(address.id, 'confidence_score', Number(event.target.value) || 0)} className={inputClassName} placeholder="Confidence score" />
                  <input value={address.landmark || ''} onChange={(event) => updateAddressField(address.id, 'landmark', event.target.value)} className={inputClassName} placeholder="Landmark" />
                  <input value={address.district || ''} onChange={(event) => updateAddressField(address.id, 'district', event.target.value)} className={inputClassName} placeholder="District" />
                  <input value={address.phone_number || ''} onChange={(event) => updateAddressField(address.id, 'phone_number', event.target.value)} className={inputClassName} placeholder="Phone Number" />
                  <input value={address.address_type || 'community'} onChange={(event) => updateAddressField(address.id, 'address_type', event.target.value)} className={inputClassName} placeholder="Address Type" />
                  <select
                    value={address.place_type || ''}
                    onChange={(event) => updateAddressField(address.id, 'place_type', event.target.value)}
                    className={selectClassName}
                    style={selectStyle}
                  >
                    <option value="">Select Place Type</option>
                    {PLACE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <input value={address.auto_generated_flag ? 'Yes' : 'No'} readOnly className={inputClassName} placeholder="Auto Generated" />
                  <textarea value={address.street_description || address.description || ''} onChange={(event) => updateAddressField(address.id, 'street_description', event.target.value)} className={`${inputClassName} min-h-24 md:col-span-2 xl:col-span-3`} placeholder="Street description" />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => saveAddressRecord(address)} className="rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white">Save Changes</button>
                  <button onClick={() => toggleAddressStatus(address)} className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-900">{address.is_active === false ? 'Enable Address' : 'Toggle Active Status'}</button>
                  {Number(address.confidence_score || 0) < 60 && <button onClick={() => saveAddressRecord(address, { moderation_status: 'flagged', is_active: true })} className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700">Mark for Review</button>}
                  {address.auto_generated_flag && <button onClick={() => saveAddressRecord(address, { moderation_status: 'active', is_active: true, auto_generated_flag: true })} className="rounded-2xl bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-700">Verify Building</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'moderation' && moderation && (
        <div className="grid gap-6 xl:grid-cols-3">
          {[
            ['Reported Addresses', moderation.reported_addresses || [], 'reported'],
            ['Suspicious Activity', moderation.suspicious_activity || [], 'suspicious'],
            ['Low Confidence', moderation.low_confidence_addresses || [], 'low-confidence'],
            ['Unverified Buildings', moderation.unverified_buildings || [], 'unverified-buildings'],
            ['Business Verification Queue', moderation.pending_business_verification || [], 'business'],
          ].map(([title, items, queueType]) => (
            <div key={title} className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-stone-950">{title}</h2>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{items.length}</span>
              </div>
              <div className="mt-6 space-y-4">
                {items.length ? items.map((item) => (
                  <div key={`${queueType}-${item.id}`} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <p className="font-semibold text-stone-950">{item.ppoint_code || item.code || item.business_name}</p>
                    <p className="mt-1 text-sm text-stone-600">{item.building_name || item.landmark || item.business_category || item.city || 'Pending review'}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">{item.moderation_status || item.status || 'pending'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {queueType !== 'business' && <button onClick={() => saveAddressRecord(item, { moderation_status: 'active', is_active: true })} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Mark Active</button>}
                      {queueType !== 'business' && <button onClick={() => saveAddressRecord(item, { moderation_status: 'disabled', is_active: false })} className="rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">Disable</button>}
                      {queueType === 'unverified-buildings' && <button onClick={() => saveAddressRecord(item, { moderation_status: 'active', is_active: true, auto_generated_flag: true })} className="rounded-full bg-sky-100 px-3 py-2 text-xs font-semibold text-sky-700">Verify Building</button>}
                      {queueType === 'business' && <button onClick={() => reviewBusiness(item.id, 'approved')} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Verify Business</button>}
                      {queueType === 'business' && <button onClick={() => reviewBusiness(item.id, 'rejected')} className="rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">Reject</button>}
                    </div>
                  </div>
                )) : <p className="text-sm text-stone-500">No items in this moderation queue.</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'businesses' && (
        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
          <h2 className="text-2xl font-black text-stone-950">Verified Business Locations</h2>
          <div className="mt-6 space-y-4">
            {businesses.map((business) => (
              <div key={business.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-stone-950">{business.business_name}</p>
                    <p className="mt-1 text-sm text-stone-600">{business.business_category} • {business.ppoint_code}</p>
                    <p className="mt-1 text-sm text-stone-600">{business.city}, {business.state}, {business.country}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">{business.verification_label}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => reviewBusiness(business.id, 'approved')} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Approve</button>
                    <button onClick={() => reviewBusiness(business.id, 'rejected')} className="rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">Reject</button>
                    <button onClick={() => reviewBusiness(business.id, 'suspended')} className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">Suspend</button>
                  </div>
                </div>
              </div>
            ))}
            {!businesses.length && <p className="text-sm text-stone-500">No businesses have been submitted yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
          <h2 className="text-2xl font-black text-stone-950">Field Agents</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="font-semibold text-stone-950">{agent.agent_code}</p>
                <p className="mt-1 text-sm text-stone-600">{agent.full_name}</p>
                <p className="mt-1 text-sm text-stone-600">{agent.territory}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-stone-500">{agent.total_addresses} mapped • {agent.pending_addresses} pending</p>
              </div>
            ))}
            {!agents.length && <p className="text-sm text-stone-500">No field agents registered yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'developers' && (
        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
          <h2 className="text-2xl font-black text-stone-950">Developers</h2>
          <div className="mt-6 space-y-4">
            {developers.map((developer) => (
              <div key={developer.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-stone-950">{developer.company_name}</p>
                    <p className="mt-1 text-sm text-stone-600">{developer.email} • {developer.plan_name}</p>
                    <p className="mt-1 text-xs text-stone-500">API Key: {developer.api_key || 'Pending activation'}</p>
                    <p className="mt-1 text-xs text-stone-500">Developer ID: {developer.developer_id} • Requests: {Number(developer.request_count || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select value={developer.plan_slug || ''} onChange={(event) => changeDeveloperPlan(developer.id, event.target.value)} className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-900">
                      {plans.filter((plan) => plan.is_active !== false).map((plan) => <option key={plan.slug} value={plan.slug}>{plan.name}</option>)}
                    </select>
                    <button onClick={() => changeDeveloperStatus(developer.id, 'active')} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Approve</button>
                    <button onClick={() => changeDeveloperStatus(developer.id, 'blocked')} className="rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">Block</button>
                    <button onClick={() => resetDeveloperUsage(developer.id)} className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">Reset Usage</button>
                    <button onClick={() => resetDeveloperKey(developer.id)} className="rounded-full bg-stone-950 px-3 py-2 text-xs font-semibold text-white">Reset API Key</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
          <h2 className="text-2xl font-black text-stone-950">API Usage Monitoring</h2>
          <div className="mt-6 space-y-4">
            {usage.map((item) => (
              <div key={`${item.developer_id}-${item.month}`} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-stone-950">{item.developer_company}</p>
                    <p className="text-sm text-stone-600">{item.developer_email} • {item.plan_name} • {item.month}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-stone-900">{item.request_count.toLocaleString()} / {formatLimitValue(item.request_limit)}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.abnormal_usage ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.abnormal_usage ? 'Abnormal usage' : 'Normal'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-black text-stone-950">Create Plan</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <input value={planForm.name} onChange={(event) => setPlanForm((previous) => ({ ...previous, name: event.target.value }))} className={inputClassName} placeholder="Plan name" />
              <input value={planForm.slug} onChange={(event) => setPlanForm((previous) => ({ ...previous, slug: event.target.value }))} className={inputClassName} placeholder="Slug" />
              <input value={planForm.request_limit} onChange={(event) => setPlanForm((previous) => ({ ...previous, request_limit: event.target.value === '' ? 0 : Number(event.target.value) }))} className={inputClassName} placeholder="Request limit" />
              <input value={planForm.price_ngn} onChange={(event) => setPlanForm((previous) => ({ ...previous, price_ngn: Number(event.target.value) }))} className={inputClassName} placeholder="Price NGN" />
              <input value={planForm.price_usd} onChange={(event) => setPlanForm((previous) => ({ ...previous, price_usd: Number(event.target.value) }))} className={inputClassName} placeholder="Price USD" />
              <textarea value={planForm.description} onChange={(event) => setPlanForm((previous) => ({ ...previous, description: event.target.value }))} className={`${inputClassName} min-h-24 md:col-span-2 xl:col-span-3`} placeholder="Plan description" />
            </div>
            <button onClick={createPlan} className="mt-4 rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">Create Plan</button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan, index) => (
              <div key={plan.id} className="rounded-[1.75rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/10">
              <input value={plan.name} onChange={(event) => setPlans((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} className={`${inputClassName} text-2xl font-black`} />
              <textarea value={plan.description || ''} onChange={(event) => setPlans((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} className={`mt-4 min-h-24 ${inputClassName}`} />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={plan.price_ngn} onChange={(event) => setPlans((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, price_ngn: Number(event.target.value) } : item))} className={inputClassName} placeholder="Price NGN" />
                <input value={plan.price_usd} onChange={(event) => setPlans((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, price_usd: Number(event.target.value) } : item))} className={inputClassName} placeholder="Price USD" />
              </div>
              <input value={plan.request_limit ?? ''} onChange={(event) => setPlans((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, request_limit: event.target.value === '' ? null : Number(event.target.value) } : item))} className={`mt-4 ${inputClassName}`} placeholder="Request limit (blank for unlimited)" />
              <div className="mt-4 flex gap-3">
                <button onClick={() => savePlan(plan)} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">Save Plan</button>
                <button onClick={() => archivePlan(plan.id)} className="rounded-2xl bg-red-100 px-5 py-3 font-semibold text-red-700">Archive</button>
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
          <h2 className="text-2xl font-black text-stone-950">Payment Management</h2>
          <div className="mt-6 space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-stone-950">{payment.developer_company}</p>
                    <p className="text-sm text-stone-600">{payment.plan_name} • {payment.currency} {payment.amount} • {payment.payment_method}</p>
                    <p className="mt-1 text-xs text-stone-500">Ref: {payment.proof_reference || 'No reference provided'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => reviewPayment(payment.id, 'approved')} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Approve</button>
                    <button onClick={() => reviewPayment(payment.id, 'rejected')} className="rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'regions' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-black text-stone-950">Region Management</h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">Bulk region activation now works directly from checkbox lists. Select countries, then states, then cities, and use the same two actions for batch enable or disable.</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {regionLevels.map((level) => (
                <button key={level.id} onClick={() => setActiveRegionLevel(level.id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeRegionLevel === level.id ? 'bg-stone-950 text-white' : 'bg-stone-100 text-stone-700'}`}>
                  {level.label}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white p-5">
              <div className="flex flex-col gap-2 border-b border-stone-200 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-stone-950">{currentRegionMeta.title} Checklist</h3>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{currentSelectedIds.length} selected</span>
                </div>
                <p className="text-sm text-stone-600">{currentRegionMeta.helper}</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="inline-flex items-center gap-3 text-sm font-semibold text-stone-900">
                  <input type="checkbox" checked={allCurrentSelected} onChange={(event) => toggleSelectAllForCurrentLevel(event.target.checked)} disabled={!currentRegionItems.length} />
                  Select All
                </label>
                <div className="flex gap-3">
                  <button onClick={() => applyRegionAction('enable')} disabled={!hasCurrentSelection} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Enable Selected</button>
                  <button onClick={() => applyRegionAction('disable')} disabled={!hasCurrentSelection} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Disable Selected</button>
                </div>
              </div>

              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-3">
                {!currentRegionItems.length && <p className="text-sm text-stone-500">{currentRegionMeta.emptyState}</p>}
                {currentRegionItems.length ? currentRegionItems.map((item) => (
                  <label key={item.id} className="flex items-center gap-3 rounded-xl border border-stone-100 px-3 py-3 text-sm text-stone-900 hover:bg-stone-50">
                    <input type="checkbox" checked={currentSelectedIds.includes(item.id)} onChange={() => toggleRegionSelection(activeRegionLevel, item.id)} />
                    <span className="flex-1">{item.name}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{item.is_active ? 'Active' : 'Inactive'}</span>
                  </label>
                )) : null}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {staff.map((staffMember) => (
                <div key={staffMember.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="font-semibold text-stone-950">{staffMember.full_name}</p>
                  <p className="mt-1 text-sm text-stone-600">{staffMember.role} • {staffMember.region_name}</p>
                  <p className="mt-1 text-xs text-stone-500">Permissions: {(staffMember.permissions || rolePermissions[staffMember.role] || []).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={createStaff} className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
            <h3 className="text-xl font-black text-stone-950">Assign Staff to Region</h3>
            <div className="mt-4 space-y-4">
              <input value={staffForm.fullName} onChange={(event) => setStaffForm({ ...staffForm, fullName: event.target.value })} className={inputClassName} placeholder="Full name" />
              <input value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} className={inputClassName} placeholder="Email" />
              <select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })} className={selectClassName} style={selectStyle}>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Field Officer">Field Officer</option>
              </select>
              <select value={staffForm.regionLevel} onChange={(event) => setStaffForm({ ...staffForm, regionLevel: event.target.value, regionId: '' })} className={selectClassName} style={selectStyle}>
                <option value="country">Country</option>
                <option value="state">State</option>
                <option value="city">City</option>
              </select>
              <select value={staffForm.regionId} onChange={(event) => setStaffForm({ ...staffForm, regionId: event.target.value })} className={selectClassName} style={selectStyle}>
                <option value="">Select region</option>
                {staffForm.regionLevel === 'country' && countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                {staffForm.regionLevel === 'state' && states.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                {staffForm.regionLevel === 'city' && cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <label className="flex items-center gap-3 text-sm text-stone-600"><input type="checkbox" checked={staffForm.isEnabled} onChange={(event) => setStaffForm({ ...staffForm, isEnabled: event.target.checked })} /> Enable account</label>
              <button className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">Assign Staff</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
          <h2 className="text-2xl font-black text-stone-950">System Settings</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input value={settings.platform_name} onChange={(event) => setSettings({ ...settings, platform_name: event.target.value })} className={inputClassName} placeholder="Platform name" />
            <input value={settings.domain} onChange={(event) => setSettings({ ...settings, domain: event.target.value })} className={inputClassName} placeholder="Domain" />
            <input value={settings.api_base_url || ''} onChange={(event) => setSettings({ ...settings, api_base_url: event.target.value })} className={inputClassName} placeholder="API base URL" />
            <input value={settings.api_rate_limit} onChange={(event) => setSettings({ ...settings, api_rate_limit: Number(event.target.value) })} className={inputClassName} placeholder="API rate limit" />
            <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600"><input type="checkbox" checked={settings.qr_enabled} onChange={(event) => setSettings({ ...settings, qr_enabled: event.target.checked })} /> Enable QR code generation</label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600"><input type="checkbox" checked={settings.payment_methods.bank_transfer_ng} onChange={(event) => setSettings({ ...settings, payment_methods: { ...settings.payment_methods, bank_transfer_ng: event.target.checked } })} /> Bank transfer</label>
            <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600"><input type="checkbox" checked={settings.payment_methods.flutterwave} onChange={(event) => setSettings({ ...settings, payment_methods: { ...settings.payment_methods, flutterwave: event.target.checked } })} /> Flutterwave</label>
            <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600"><input type="checkbox" checked={settings.payment_methods.paystack} onChange={(event) => setSettings({ ...settings, payment_methods: { ...settings.payment_methods, paystack: event.target.checked } })} /> Paystack</label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <input value={settings.bank_transfer_details.bank_name} onChange={(event) => setSettings({ ...settings, bank_transfer_details: { ...settings.bank_transfer_details, bank_name: event.target.value } })} className={inputClassName} placeholder="Bank name" />
            <input value={settings.bank_transfer_details.account_name} onChange={(event) => setSettings({ ...settings, bank_transfer_details: { ...settings.bank_transfer_details, account_name: event.target.value } })} className={inputClassName} placeholder="Account name" />
            <input value={settings.bank_transfer_details.account_number} onChange={(event) => setSettings({ ...settings, bank_transfer_details: { ...settings.bank_transfer_details, account_number: event.target.value } })} className={inputClassName} placeholder="Account number" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input value={settings.support_contacts?.support_email || ''} onChange={(event) => setSettings({ ...settings, support_contacts: { ...settings.support_contacts, support_email: event.target.value } })} className={inputClassName} placeholder="Support email" />
            <input value={settings.support_contacts?.business_email || ''} onChange={(event) => setSettings({ ...settings, support_contacts: { ...settings.support_contacts, business_email: event.target.value } })} className={inputClassName} placeholder="Business email" />
            <input value={settings.support_contacts?.support_phone_number || ''} onChange={(event) => setSettings({ ...settings, support_contacts: { ...settings.support_contacts, support_phone_number: event.target.value } })} className={inputClassName} placeholder="Support phone number" />
            <input value={settings.support_contacts?.emergency_contact_number || ''} onChange={(event) => setSettings({ ...settings, support_contacts: { ...settings.support_contacts, emergency_contact_number: event.target.value } })} className={inputClassName} placeholder="Emergency contact number" />
            <input value={settings.map_api_keys?.public_map_key || ''} onChange={(event) => setSettings({ ...settings, map_api_keys: { ...settings.map_api_keys, public_map_key: event.target.value } })} className={inputClassName} placeholder="Public map key" />
            <input value={settings.map_api_keys?.routing_key || ''} onChange={(event) => setSettings({ ...settings, map_api_keys: { ...settings.map_api_keys, routing_key: event.target.value } })} className={inputClassName} placeholder="Routing key" />
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-stone-950">Address Creation Settings</h3>
                <p className="mt-1 text-sm text-stone-600">Control which optional fields appear in the fast PPOINNT creation flow and the expected quick-create target.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">Fast-create UX</span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"><input type="checkbox" checked={settings.address_settings?.require_building_name !== false} onChange={(event) => setSettings({ ...settings, address_settings: { ...settings.address_settings, require_building_name: event.target.checked } })} /> Require building or place name</label>
              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"><input type="checkbox" checked={settings.address_settings?.show_landmark !== false} onChange={(event) => setSettings({ ...settings, address_settings: { ...settings.address_settings, show_landmark: event.target.checked } })} /> Show landmark field</label>
              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"><input type="checkbox" checked={settings.address_settings?.show_street_description !== false} onChange={(event) => setSettings({ ...settings, address_settings: { ...settings.address_settings, show_street_description: event.target.checked } })} /> Show street description field</label>
              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"><input type="checkbox" checked={settings.address_settings?.show_phone_number !== false} onChange={(event) => setSettings({ ...settings, address_settings: { ...settings.address_settings, show_phone_number: event.target.checked } })} /> Show phone number field</label>
              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"><input type="checkbox" checked={settings.address_settings?.enable_house_number !== false} onChange={(event) => setSettings({ ...settings, address_settings: { ...settings.address_settings, enable_house_number: event.target.checked } })} /> Enable house number in Add More Details</label>
              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"><input type="checkbox" checked={settings.address_settings?.enable_district !== false} onChange={(event) => setSettings({ ...settings, address_settings: { ...settings.address_settings, enable_district: event.target.checked } })} /> Enable district in Add More Details</label>
              <input value={settings.address_settings?.quick_create_target_seconds || 5} onChange={(event) => setSettings({ ...settings, address_settings: { ...settings.address_settings, quick_create_target_seconds: Number(event.target.value) || 5 } })} className={inputClassName} placeholder="Quick-create target seconds" />
            </div>
          </div>

          <button onClick={saveSettings} className="mt-6 rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">Save System Settings</button>
        </div>
      )}

      {activeTab === 'registry' && (
        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-2xl font-black text-stone-950">National Address Registry</h2>
            <div className="flex gap-3">
              <input value={registryQuery} onChange={(event) => setRegistryQuery(event.target.value)} className={inputClassName} placeholder="Search registry" />
              <button onClick={() => loadAdminData()} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">Search</button>
              <button onClick={exportRegistry} className="rounded-2xl bg-stone-100 px-5 py-3 font-semibold text-stone-900">Export</button>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {registry.map((record) => (
              <div key={record.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-stone-950">{record.ppoint_code}</p>
                    <p className="mt-1 text-sm text-stone-600">{record.city}, {record.state}, {record.country}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">{record.verified_status}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input value={record.building_name || ''} onChange={(event) => updateRegistryField(record.id, 'building_name', event.target.value)} className={inputClassName} placeholder="Building name" />
                  <input value={record.district || ''} onChange={(event) => updateRegistryField(record.id, 'district', event.target.value)} className={inputClassName} placeholder="District" />
                  <input value={record.street_or_landmark || ''} onChange={(event) => updateRegistryField(record.id, 'street_or_landmark', event.target.value)} className={`${inputClassName} md:col-span-2`} placeholder="Street or landmark" />
                  <select value={record.verified_status || 'active'} onChange={(event) => updateRegistryField(record.id, 'verified_status', event.target.value)} className={selectClassName} style={selectStyle}>
                    <option value="active">Active</option>
                    <option value="verified_business">Verified Business</option>
                    <option value="flagged">Flagged</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <button onClick={() => saveRegistryRecord(record)} className="mt-4 rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white">Save Registry Record</button>
              </div>
            ))}
            {!registry.length && <p className="text-sm text-stone-500">No registry records matched this search.</p>}
          </div>
        </div>
      )}

      {activeTab === 'dispatch' && dispatch && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
              <h2 className="text-2xl font-black text-stone-950">Dispatch Overview</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">Delivery Zones</p>
                  <p className="mt-2 text-3xl font-black text-stone-950">{Number(dispatch.delivery_zones || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">Dispatch Agents</p>
                  <p className="mt-2 text-3xl font-black text-stone-950">{Number(dispatch.dispatch_agents || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">Delivery Activity</p>
                  <p className="mt-2 text-3xl font-black text-stone-950">{Number(dispatch.delivery_activity || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-black text-stone-950">Dispatch Controls</h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">This panel reflects delivery and logistics readiness. Use the address, registry, and region tabs to control the underlying records used by routing and fulfillment teams.</p>
            <div className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-5">
              <p className="text-sm text-stone-600">Admin parity is now available for logistics visibility. Additional live dispatch assignment controls can be layered onto these totals without changing the public address model.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
