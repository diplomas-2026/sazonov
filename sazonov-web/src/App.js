import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add,
  AdminPanelSettings,
  AssignmentTurnedIn,
  Dashboard,
  CloudUpload,
  DeleteOutline,
  Download,
  Edit,
  Description,
  Login,
  Logout,
  ManageAccounts,
  Refresh,
  Assignment,
  Person,
  School,
} from '@mui/icons-material';
import './App.css';
import { api, clearStoredAuth, loadStoredAuth, saveStoredAuth } from './api';

const STATUS_LABELS = {
  SUBMITTED: 'Подана',
  UNDER_REVIEW: 'На проверке',
  MISSING_DOCS: 'Нужны документы',
  ACCEPTED: 'Одобрена',
  REJECTED: 'Отклонена',
};

const ROLE_LABELS = {
  APPLICANT: 'Абитуриент',
  STAFF: 'Сотрудник',
  ADMIN: 'Администратор',
};

const DOCUMENT_TYPES = [
  { value: 'PASSPORT', label: 'Паспорт' },
  { value: 'EDUCATION_CERTIFICATE', label: 'Аттестат' },
  { value: 'PHOTO', label: 'Фотография' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Медицинская справка' },
  { value: 'SNILS', label: 'СНИЛС' },
  { value: 'OTHER', label: 'Другой документ' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Все заявки' },
  ...Object.keys(STATUS_LABELS).map((value) => ({ value, label: STATUS_LABELS[value] })),
];

const emptyLogin = {
  username: 'admin',
  password: 'admin123',
};

const emptyRegister = {
  fullName: '',
  username: '',
  password: '',
  email: '',
  phone: '',
};

const emptyProfile = {
  fullName: '',
  email: '',
  phone: '',
};

const emptyApplication = {
  specialityId: '',
  passportSeries: '',
  passportNumber: '',
  snils: '',
  educationDocumentNumber: '',
  graduationSchool: '',
  graduationYear: new Date().getFullYear(),
  points: 0,
  applicantComment: '',
};

const emptyDepartment = {
  code: '',
  name: '',
  description: '',
};

const emptySpeciality = {
  departmentId: '',
  code: '',
  name: '',
  description: '',
  budgetPlaces: 0,
  paidPlaces: 0,
  admissionPlan: 0,
};

const emptyUser = {
  fullName: '',
  username: '',
  password: '',
  email: '',
  phone: '',
  role: 'STAFF',
  active: true,
};

function App() {
  const [booting, setBooting] = useState(true);
  const [auth, setAuth] = useState(null);
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [applicationForm, setApplicationForm] = useState(emptyApplication);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartment);
  const [specialityForm, setSpecialityForm] = useState(emptySpeciality);
  const [userForm, setUserForm] = useState(emptyUser);

  const [publicDepartments, setPublicDepartments] = useState([]);
  const [publicSpecialities, setPublicSpecialities] = useState([]);
  const [publicDashboard, setPublicDashboard] = useState(null);
  const [applicantApplications, setApplicantApplications] = useState([]);
  const [staffApplications, setStaffApplications] = useState([]);
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminDepartments, setAdminDepartments] = useState([]);
  const [adminSpecialities, setAdminSpecialities] = useState([]);
  const [adminDashboard, setAdminDashboard] = useState(null);

  const [selectedApplicantApplicationId, setSelectedApplicantApplicationId] = useState('');
  const [selectedStaffApplicationId, setSelectedStaffApplicationId] = useState('');
  const [selectedSpecialityId, setSelectedSpecialityId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [creatingSpeciality, setCreatingSpeciality] = useState(false);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const loadPublic = useCallback(async () => {
    try {
      const [departments, specialities, dashboard] = await Promise.all([
        api.publicDepartments(),
        api.publicSpecialities(),
        api.publicDashboard(),
      ]);
      setPublicDepartments(departments);
      setPublicSpecialities(specialities);
      setPublicDashboard(dashboard);
    } catch (nextError) {
      setError(nextError.message);
    }
  }, []);

  const loadWorkspace = useCallback(
    async (nextAuth = auth) => {
      if (!nextAuth) {
        return;
      }

      try {
        await loadPublic();

        if (nextAuth.user.role === 'APPLICANT') {
          const applications = await api.applicantApplications(nextAuth.token);
          setApplicantApplications(applications);
          setSelectedApplicantApplicationId((current) => current || `${applications[0]?.id || ''}`);
        }

        if (nextAuth.user.role === 'STAFF' || nextAuth.user.role === 'ADMIN') {
          const applications = await api.staffApplications(nextAuth.token, staffFilter === 'ALL' ? undefined : staffFilter);
          setStaffApplications(applications);
          setSelectedStaffApplicationId((current) => current || `${applications[0]?.id || ''}`);
        }

        if (nextAuth.user.role === 'ADMIN') {
          const [dashboard, departments, specialities, users] = await Promise.all([
            api.adminDashboard(nextAuth.token),
            api.adminDepartments(nextAuth.token),
            api.adminSpecialities(nextAuth.token),
            api.adminUsers(nextAuth.token),
          ]);
          setAdminDashboard(dashboard);
          setAdminDepartments(departments);
          setAdminSpecialities(specialities);
          setAdminUsers(users);
          setSelectedDepartmentId((current) => current || `${departments[0]?.id || ''}`);
          setSelectedSpecialityId((current) => current || `${specialities[0]?.id || ''}`);
          setSelectedUserId((current) => current || `${users[0]?.id || ''}`);
        }
      } catch (nextError) {
        setError(nextError.message);
      }
    },
    [auth, loadPublic, staffFilter],
  );

  useEffect(() => {
    const stored = loadStoredAuth();

    (async () => {
      try {
        const [departments, specialities, dashboard] = await Promise.all([
          api.publicDepartments(),
          api.publicSpecialities(),
          api.publicDashboard(),
        ]);
        setPublicDepartments(departments);
        setPublicSpecialities(specialities);
        setPublicDashboard(dashboard);

        if (!stored?.token) {
          return;
        }

        const me = await api.me(stored.token);
        const nextAuth = { token: me.token || stored.token, user: me.user };
        setAuth(nextAuth);
        saveStoredAuth(nextAuth);
        setProfileForm({
          fullName: me.user.fullName,
          email: me.user.email,
          phone: me.user.phone,
        });

        if (me.user.role === 'APPLICANT') {
          const applications = await api.applicantApplications(nextAuth.token);
          setApplicantApplications(applications);
          setSelectedApplicantApplicationId(`${applications[0]?.id || ''}`);
        }

        if (me.user.role === 'STAFF' || me.user.role === 'ADMIN') {
          const applications = await api.staffApplications(nextAuth.token);
          setStaffApplications(applications);
          setSelectedStaffApplicationId(`${applications[0]?.id || ''}`);
        }

        if (me.user.role === 'ADMIN') {
          const [adminDashboardData, departmentsData, specialitiesData, usersData] = await Promise.all([
            api.adminDashboard(nextAuth.token),
            api.adminDepartments(nextAuth.token),
            api.adminSpecialities(nextAuth.token),
            api.adminUsers(nextAuth.token),
          ]);
          setAdminDashboard(adminDashboardData);
          setAdminDepartments(departmentsData);
          setAdminSpecialities(specialitiesData);
          setAdminUsers(usersData);
          setSelectedDepartmentId(`${departmentsData[0]?.id || ''}`);
          setSelectedSpecialityId(`${specialitiesData[0]?.id || ''}`);
          setSelectedUserId(`${usersData[0]?.id || ''}`);
        }
      } catch {
        clearStoredAuth();
        setAuth(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (auth?.user?.role === 'APPLICANT') {
      setProfileForm({
        fullName: auth.user.fullName,
        email: auth.user.email,
        phone: auth.user.phone,
      });
    }
  }, [auth]);

  useEffect(() => {
    if (auth?.user?.role === 'APPLICANT' && applicantApplications.length > 0) {
      if (!selectedApplicantApplicationId || !applicantApplications.some((item) => `${item.id}` === `${selectedApplicantApplicationId}`)) {
        setSelectedApplicantApplicationId(`${applicantApplications[0].id}`);
      }
    }
  }, [auth, applicantApplications, selectedApplicantApplicationId]);

  useEffect(() => {
    if ((auth?.user?.role === 'STAFF' || auth?.user?.role === 'ADMIN') && staffApplications.length > 0) {
      if (!selectedStaffApplicationId || !staffApplications.some((item) => `${item.id}` === `${selectedStaffApplicationId}`)) {
        setSelectedStaffApplicationId(`${staffApplications[0].id}`);
      }
    }
  }, [auth, staffApplications, selectedStaffApplicationId]);

  useEffect(() => {
    if (auth?.user?.role === 'ADMIN' && adminSpecialities.length > 0) {
      if (!creatingSpeciality && (!selectedSpecialityId || !adminSpecialities.some((item) => `${item.id}` === `${selectedSpecialityId}`))) {
        const first = adminSpecialities[0];
        setSelectedSpecialityId(`${first.id}`);
        setSpecialityForm({
          code: first.code,
          name: first.name,
          description: first.description || '',
          budgetPlaces: first.budgetPlaces,
          paidPlaces: first.paidPlaces,
          admissionPlan: first.admissionPlan,
        });
      }
    }
  }, [auth, adminSpecialities, selectedSpecialityId, creatingSpeciality]);

  useEffect(() => {
    if (auth?.user?.role === 'ADMIN' && adminUsers.length > 0) {
      if (!creatingUser && (!selectedUserId || !adminUsers.some((item) => `${item.id}` === `${selectedUserId}`))) {
        const first = adminUsers[0];
        setSelectedUserId(`${first.id}`);
      }
    }
  }, [auth, adminUsers, selectedUserId, creatingUser]);

  useEffect(() => {
    if (!applicationForm.specialityId && publicSpecialities.length > 0) {
      setApplicationForm((current) => ({
        ...current,
        specialityId: `${publicSpecialities[0].id}`,
      }));
    }
  }, [applicationForm.specialityId, publicSpecialities]);

  const selectedApplicantApplication = useMemo(
    () => applicantApplications.find((item) => `${item.id}` === `${selectedApplicantApplicationId}`) || null,
    [applicantApplications, selectedApplicantApplicationId],
  );

  const selectedStaffApplication = useMemo(
    () => staffApplications.find((item) => `${item.id}` === `${selectedStaffApplicationId}`) || null,
    [staffApplications, selectedStaffApplicationId],
  );

  const selectedAdminSpeciality = useMemo(
    () => adminSpecialities.find((item) => `${item.id}` === `${selectedSpecialityId}`) || null,
    [adminSpecialities, selectedSpecialityId],
  );

  const selectedAdminUser = useMemo(
    () => adminUsers.find((item) => `${item.id}` === `${selectedUserId}`) || null,
    [adminUsers, selectedUserId],
  );

  const selectedDepartment = useMemo(
    () => adminDepartments.find((item) => `${item.id}` === `${selectedDepartmentId}`) || null,
    [adminDepartments, selectedDepartmentId],
  );

  const navigationTabs = useMemo(() => {
    if (!auth) {
      return [];
    }

    switch (auth.user.role) {
      case 'APPLICANT':
        return [
          { value: 'profile', label: 'Профиль', icon: <Person fontSize="small" /> },
          { value: 'applications', label: 'Заявки', icon: <Assignment fontSize="small" /> },
          { value: 'application-create', label: 'Создание заявки', icon: <CloudUpload fontSize="small" /> },
          { value: 'documents', label: 'Документы', icon: <Description fontSize="small" /> },
          { value: 'departments', label: 'Отделения', icon: <School fontSize="small" /> },
          { value: 'specialities', label: 'Специальности', icon: <AssignmentTurnedIn fontSize="small" /> },
        ];
      case 'STAFF':
        return [
          { value: 'queue', label: 'Очередь', icon: <AssignmentTurnedIn fontSize="small" /> },
          { value: 'departments', label: 'Отделения', icon: <School fontSize="small" /> },
          { value: 'specialities', label: 'Специальности', icon: <AssignmentTurnedIn fontSize="small" /> },
        ];
      case 'ADMIN':
        return [
          { value: 'dashboard', label: 'Сводка', icon: <Dashboard fontSize="small" /> },
          { value: 'departments', label: 'Отделения', icon: <School fontSize="small" /> },
          { value: 'specialities', label: 'Специальности', icon: <AssignmentTurnedIn fontSize="small" /> },
          { value: 'users', label: 'Пользователи', icon: <AdminPanelSettings fontSize="small" /> },
        ];
      default:
        return [];
    }
  }, [auth]);

  useEffect(() => {
    if (!auth) {
      setActiveSection('');
      return;
    }

    if (navigationTabs.length === 0) {
      setActiveSection('');
      return;
    }

    if (activeSection !== 'application-details' && !navigationTabs.some((item) => item.value === activeSection)) {
      setActiveSection(navigationTabs[0].value);
    }
  }, [auth, navigationTabs, activeSection]);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await api.login(loginForm.username, loginForm.password);
      const nextAuth = { token: response.token, user: response.user };
      setAuth(nextAuth);
      saveStoredAuth(nextAuth);
      setMessage(`Добро пожаловать, ${response.user.fullName}`);
      await loadWorkspace(nextAuth);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const created = await api.register(registerForm);
      const response = await api.login(registerForm.username, registerForm.password);
      const nextAuth = { token: response.token, user: response.user };
      setAuth(nextAuth);
      saveStoredAuth(nextAuth);
      setMessage(`Аккаунт создан: ${created.fullName}`);
      setRegisterForm(emptyRegister);
      setMode('login');
      await loadWorkspace(nextAuth);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleLogout() {
    clearStoredAuth();
    setAuth(null);
    setApplicantApplications([]);
    setStaffApplications([]);
    setAdminUsers([]);
    setAdminDepartments([]);
    setAdminSpecialities([]);
    setAdminDashboard(null);
    setPublicDepartments([]);
    setSelectedApplicantApplicationId('');
    setSelectedStaffApplicationId('');
    setSelectedSpecialityId('');
    setSelectedUserId('');
    setSelectedDepartmentId('');
    setMessage('Сеанс завершён');
    await loadPublic();
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    if (!auth) return;
    setError('');
    setMessage('');

    try {
      const updated = await api.updateMe(auth.token, profileForm);
      const nextAuth = { ...auth, user: { ...auth.user, ...updated } };
      setAuth(nextAuth);
      saveStoredAuth(nextAuth);
      setMessage('Профиль обновлён');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleCreateApplication(event) {
    event.preventDefault();
    if (!auth) return;
    setError('');
    setMessage('');

    try {
      const created = await api.applicantCreateApplication(auth.token, {
        ...applicationForm,
        specialityId: Number(applicationForm.specialityId),
        graduationYear: Number(applicationForm.graduationYear),
        points: Number(applicationForm.points),
      });
      setMessage(`Заявка №${created.id} создана`);
      setApplicationForm({
        ...emptyApplication,
        specialityId: applicationForm.specialityId || `${publicSpecialities[0]?.id || ''}`,
      });
      const applications = await api.applicantApplications(auth.token);
      setApplicantApplications(applications);
      setSelectedApplicantApplicationId(`${created.id}`);
      setActiveSection('applications');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleUploadDocument(event) {
    event.preventDefault();
    if (!auth || !selectedApplicantApplicationId) return;
    const file = event.currentTarget.elements.file?.files?.[0];
    const type = event.currentTarget.elements.type?.value;
    if (!file) {
      setError('Выберите файл');
      return;
    }

    setError('');
    setMessage('');

    try {
      await api.uploadDocument(auth.token, selectedApplicantApplicationId, type, file);
      const applications = await api.applicantApplications(auth.token);
      setApplicantApplications(applications);
      setMessage('Документ загружен');
      event.currentTarget.reset();
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleDeleteDocument(documentId) {
    if (!auth) return;
    setError('');
    setMessage('');

    try {
      await api.deleteDocument(auth.token, documentId);
      const applications = await api.applicantApplications(auth.token);
      setApplicantApplications(applications);
      setMessage('Документ удалён');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleDownloadDocument(documentId) {
    if (!auth) return;

    try {
      const blob = await api.downloadDocument(auth.token, documentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document-${documentId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleStaffStatusSave(event) {
    event.preventDefault();
    if (!auth || !selectedStaffApplication) return;
    const form = new FormData(event.currentTarget);
    setError('');
    setMessage('');

    try {
      await api.staffUpdateStatus(auth.token, selectedStaffApplication.id, {
        status: form.get('status'),
        staffComment: form.get('staffComment'),
      });
      const applications = await api.staffApplications(auth.token, staffFilter === 'ALL' ? undefined : staffFilter);
      setStaffApplications(applications);
      setMessage('Статус заявки обновлён');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleStaffFilterChange(nextFilter) {
    if (!auth) return;
    setStaffFilter(nextFilter);
    try {
      const applications = await api.staffApplications(auth.token, nextFilter === 'ALL' ? undefined : nextFilter);
      setStaffApplications(applications);
      setSelectedStaffApplicationId(`${applications[0]?.id || ''}`);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleSpecialitySave(event) {
    event.preventDefault();
    if (!auth || auth.user.role !== 'ADMIN') return;
    setError('');
    setMessage('');

    try {
      const payload = {
        ...specialityForm,
        departmentId: Number(specialityForm.departmentId),
        budgetPlaces: Number(specialityForm.budgetPlaces),
        paidPlaces: Number(specialityForm.paidPlaces),
        admissionPlan: Number(specialityForm.admissionPlan),
      };
      let saved;
      if (selectedAdminSpeciality) {
        saved = await api.adminUpdateSpeciality(auth.token, selectedAdminSpeciality.id, payload);
        setMessage('Специальность обновлена');
      } else {
        saved = await api.adminCreateSpeciality(auth.token, payload);
        setMessage('Специальность создана');
      }
      setCreatingSpeciality(false);
      const specialities = await api.adminSpecialities(auth.token);
      setAdminSpecialities(specialities);
      if (saved) {
        setSelectedSpecialityId(`${saved.id}`);
        setSpecialityForm({
          departmentId: `${saved.department?.id || ''}`,
          code: saved.code,
          name: saved.name,
          description: saved.description || '',
          budgetPlaces: saved.budgetPlaces,
          paidPlaces: saved.paidPlaces,
          admissionPlan: saved.admissionPlan,
        });
      }
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleDeleteSpeciality() {
    if (!auth || !selectedAdminSpeciality) return;
    setError('');
    setMessage('');

    try {
      await api.adminDeleteSpeciality(auth.token, selectedAdminSpeciality.id);
      setMessage('Специальность удалена');
      const specialities = await api.adminSpecialities(auth.token);
      setAdminSpecialities(specialities);
      if (specialities.length > 0) {
        const first = specialities[0];
        setCreatingSpeciality(false);
        setSelectedSpecialityId(`${first.id}`);
        setSpecialityForm({
          departmentId: `${first.department?.id || ''}`,
          code: first.code,
          name: first.name,
          description: first.description || '',
          budgetPlaces: first.budgetPlaces,
          paidPlaces: first.paidPlaces,
          admissionPlan: first.admissionPlan,
        });
      } else {
        setCreatingSpeciality(false);
        setSelectedSpecialityId('');
        setSpecialityForm(emptySpeciality);
      }
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleUserSave(event) {
    event.preventDefault();
    if (!auth || auth.user.role !== 'ADMIN') return;
    setError('');
    setMessage('');

    try {
      const payload = {
        fullName: userForm.fullName,
        username: userForm.username,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        password: userForm.password,
        active: userForm.active,
      };
      let saved;
      if (selectedAdminUser) {
        saved = await api.adminUpdateUser(auth.token, selectedAdminUser.id, payload);
        setMessage('Пользователь обновлён');
      } else {
        saved = await api.adminCreateUser(auth.token, { ...payload, password: userForm.password });
        setMessage('Пользователь создан');
      }
      setCreatingUser(false);
      const users = await api.adminUsers(auth.token);
      setAdminUsers(users);
      if (saved) {
        setSelectedUserId(`${saved.id}`);
        setUserForm({
          fullName: saved.fullName,
          username: saved.username,
          password: '',
          email: saved.email,
          phone: saved.phone,
          role: saved.role,
          active: saved.active,
        });
      }
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleWorkspaceRefresh() {
    if (!auth) {
      return;
    }

    await loadWorkspace(auth);
  }

  function selectSpecialityForEditing(speciality) {
    setCreatingSpeciality(false);
    setSelectedSpecialityId(`${speciality.id}`);
    setSpecialityForm({
      departmentId: `${speciality.department?.id || ''}`,
      code: speciality.code,
      name: speciality.name,
      description: speciality.description || '',
      budgetPlaces: speciality.budgetPlaces,
      paidPlaces: speciality.paidPlaces,
      admissionPlan: speciality.admissionPlan,
    });
  }

  function selectUserForEditing(user) {
    setCreatingUser(false);
    setSelectedUserId(`${user.id}`);
    setUserForm({
      fullName: user.fullName,
      username: user.username,
      password: '',
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
    });
  }

  function startNewSpeciality() {
    setCreatingSpeciality(true);
    setSelectedSpecialityId('');
    setSpecialityForm({
      ...emptySpeciality,
      departmentId: selectedDepartment?.id ? `${selectedDepartment.id}` : `${adminDepartments[0]?.id || ''}`,
    });
  }

  async function handleDepartmentSave(event) {
    event.preventDefault();
    if (!auth || auth.user.role !== 'ADMIN') return;
    setError('');
    setMessage('');

    try {
      const payload = {
        ...departmentForm,
      };
      let saved;
      if (selectedDepartment) {
        saved = await api.adminUpdateDepartment(auth.token, selectedDepartment.id, payload);
        setMessage('Отделение обновлено');
      } else {
        saved = await api.adminCreateDepartment(auth.token, payload);
        setMessage('Отделение создано');
      }
      setCreatingDepartment(false);
      const departments = await api.adminDepartments(auth.token);
      setAdminDepartments(departments);
      if (saved) {
        setSelectedDepartmentId(`${saved.id}`);
        setDepartmentForm({
          code: saved.code,
          name: saved.name,
          description: saved.description || '',
        });
      }
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleDeleteDepartment() {
    if (!auth || !selectedDepartment) return;
    setError('');
    setMessage('');

    try {
      await api.adminDeleteDepartment(auth.token, selectedDepartment.id);
      setMessage('Отделение удалено');
      const departments = await api.adminDepartments(auth.token);
      setAdminDepartments(departments);
      if (departments.length > 0) {
        const first = departments[0];
        setCreatingDepartment(false);
        setSelectedDepartmentId(`${first.id}`);
        setDepartmentForm({
          code: first.code,
          name: first.name,
          description: first.description || '',
        });
      } else {
        setCreatingDepartment(false);
        setSelectedDepartmentId('');
        setDepartmentForm(emptyDepartment);
      }
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  function selectDepartmentForEditing(department) {
    setCreatingDepartment(false);
    setSelectedDepartmentId(`${department.id}`);
    setDepartmentForm({
      code: department.code,
      name: department.name,
      description: department.description || '',
    });
  }

  function startNewDepartment() {
    setCreatingDepartment(true);
    setSelectedDepartmentId('');
    setDepartmentForm(emptyDepartment);
  }

  function startNewUser() {
    setCreatingUser(true);
    setSelectedUserId('');
    setUserForm(emptyUser);
  }

  const primaryActionLabel = selectedAdminSpeciality && !creatingSpeciality ? 'Сохранить специальность' : 'Создать специальность';
  const departmentActionLabel = selectedDepartment && !creatingDepartment ? 'Сохранить отделение' : 'Создать отделение';
  const userActionLabel = selectedAdminUser && !creatingUser ? 'Сохранить пользователя' : 'Создать пользователя';

  return (
    <Box
      className="app-shell"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #ffffff 0%, #f6f9ff 48%, #edf3fb 100%)',
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha('#fff', 0.88),
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Toolbar sx={{ minHeight: 76 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 42,
                height: 42,
                fontWeight: 700,
                boxShadow: '0 8px 20px rgba(26,115,232,0.2)',
              }}
            >
              ПК
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ display: 'block', color: 'primary.main', fontWeight: 700, letterSpacing: 0.6 }}>
                ГБПОУ ПГК
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                Система учета приемной комиссии
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
            {auth ? (
              <>
                <Button variant="outlined" startIcon={<Refresh />} onClick={handleWorkspaceRefresh} sx={{ borderRadius: 2 }}>
                  Обновить
                </Button>
                <Button variant="contained" color="inherit" startIcon={<Logout />} onClick={handleLogout} sx={{ borderRadius: 2 }}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={mode === 'login' ? 'contained' : 'text'}
                  startIcon={<Login />}
                  onClick={() => setMode('login')}
                  sx={{ borderRadius: 2 }}
                >
                  Вход
                </Button>
                <Button
                  variant={mode === 'register' ? 'contained' : 'text'}
                  startIcon={<ManageAccounts />}
                  onClick={() => setMode('register')}
                  sx={{ borderRadius: 2 }}
                >
                  Регистрация
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>

        {auth ? (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: { xs: 1, md: 3 } }}>
            <Tabs
              value={activeSection}
              onChange={(_, nextSection) => setActiveSection(nextSection)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 56,
                '& .MuiTab-root': {
                  minHeight: 56,
                  textTransform: 'none',
                  fontWeight: 600,
                },
              }}
            >
              {navigationTabs.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} icon={tab.icon} iconPosition="start" />
              ))}
            </Tabs>
          </Box>
        ) : null}
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3, pb: 6 }}>
        <Stack spacing={2.5} sx={{ mb: 3 }}>
          {message ? <Alert severity="success" variant="outlined">{message}</Alert> : null}
          {error ? <Alert severity="error" variant="outlined">{error}</Alert> : null}
        </Stack>

        {booting ? (
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ py: 7 }}>
              <Stack spacing={2} alignItems="center" justifyContent="center">
                <CircularProgress />
                <Typography color="text.secondary">Подключаемся к API и загружаем данные...</Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : !auth ? (
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={7}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 0.6 }}>
                        Приемная кампания
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, mb: 1 }}>
                        Единая система учета заявок, документов и статусов
                      </Typography>
                      <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
                        Платформа для абитуриентов, сотрудников и администратора: личный кабинет, проверка документов,
                        конкурсные списки и статистика приемной комиссии.
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <FeatureCard
                        icon={<School fontSize="small" />}
                        title="Абитуриент"
                        text="Подает заявку, загружает документы и отслеживает статус в личном кабинете."
                      />
                      <FeatureCard
                        icon={<AssignmentTurnedIn fontSize="small" />}
                        title="Сотрудник"
                        text="Проверяет пакет документов, меняет статус и оставляет комментарии по заявке."
                      />
                      <FeatureCard
                        icon={<AdminPanelSettings fontSize="small" />}
                        title="Администратор"
                        text="Управляет пользователями, отделениями, специальностями и видит общую аналитику приемной кампании."
                      />
                    </Grid>

                    <Divider />

                    <Grid container spacing={2}>
                      <MetricCard label="Отделений" value={publicDepartments.length} />
                      <MetricCard label="Специальностей" value={publicSpecialities.length} />
                      <MetricCard label="Заявок" value={publicDashboard?.totalApplications || 0} />
                      <MetricCard label="На проверке" value={publicDashboard?.underReview || 0} />
                    </Grid>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={`Одобрено: ${publicDashboard?.accepted || 0}`} color="success" variant="outlined" />
                      <Chip label={`Отклонено: ${publicDashboard?.rejected || 0}`} color="error" variant="outlined" />
                      <Chip label={`Нужны документы: ${publicDashboard?.missingDocs || 0}`} color="warning" variant="outlined" />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Tabs
                    value={mode}
                    onChange={(_, nextMode) => setMode(nextMode)}
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{ mb: 2 }}
                  >
                    <Tab value="login" label="Вход" />
                    <Tab value="register" label="Регистрация" />
                  </Tabs>

                  {mode === 'login' ? (
                    <Stack component="form" spacing={2} onSubmit={handleLogin}>
                      <TextField
                        label="Логин"
                        value={loginForm.username}
                        onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                        placeholder="admin"
                        fullWidth
                      />
                      <TextField
                        label="Пароль"
                        type="password"
                        value={loginForm.password}
                        onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                        placeholder="admin123"
                        fullWidth
                      />
                      <Button type="submit" variant="contained" startIcon={<Login />} sx={{ alignSelf: 'flex-start' }}>
                        Войти
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        Демо-доступ: <strong>admin / admin123</strong> или <strong>staff / staff123</strong>
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack component="form" spacing={2} onSubmit={handleRegister}>
                      <TextField
                        label="ФИО"
                        value={registerForm.fullName}
                        onChange={(event) => setRegisterForm({ ...registerForm, fullName: event.target.value })}
                        placeholder="Иванов Иван Иванович"
                        fullWidth
                      />
                      <TextField
                        label="Логин"
                        value={registerForm.username}
                        onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                        placeholder="ivanov"
                        fullWidth
                      />
                      <TextField
                        label="Пароль"
                        type="password"
                        value={registerForm.password}
                        onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                        placeholder="Не меньше 6 символов"
                        fullWidth
                      />
                      <TextField
                        label="Email"
                        type="email"
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                        placeholder="student@example.com"
                        fullWidth
                      />
                      <TextField
                        label="Телефон"
                        value={registerForm.phone}
                        onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })}
                        placeholder="+7 (900) 000-00-00"
                        fullWidth
                      />
                      <Button type="submit" variant="contained" startIcon={<ManageAccounts />} sx={{ alignSelf: 'flex-start' }}>
                        Создать аккаунт
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Stack spacing={3}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2} alignItems="stretch">
                  <Grid item xs={12} md={5}>
                    <Stack spacing={1}>
                      <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 0.6 }}>
                        В системе
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {auth.user.fullName}
                      </Typography>
                      <Typography color="text.secondary">
                        {ROLE_LABELS[auth.user.role]} · {auth.user.username}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <Grid container spacing={2}>
                      <MetricCard label="Моя роль" value={ROLE_LABELS[auth.user.role]} />
                      <MetricCard label="Специальностей" value={publicSpecialities.length} />
                      <MetricCard label="Заявок" value={publicDashboard?.totalApplications || 0} />
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {renderActiveSection({
              auth,
              activeSection,
              profileForm,
              setProfileForm,
              handleSaveProfile,
              applicationForm,
              setApplicationForm,
              publicDepartments,
              publicSpecialities,
              applicantApplications,
              selectedApplicantApplication,
              setSelectedApplicantApplicationId,
              setActiveSection,
              handleCreateApplication,
              handleUploadDocument,
              handleDeleteDocument,
              handleDownloadDocument,
              documentTypes: DOCUMENT_TYPES,
              staffFilter,
              setStaffFilter: handleStaffFilterChange,
              applications: staffApplications,
              selectedStaffApplication,
              setSelectedStaffApplicationId,
              handleStaffStatusSave,
              statusOptions: STATUS_OPTIONS,
              adminDashboard,
              adminSpecialities,
              adminUsers,
              specialityForm,
              setSpecialityForm,
              selectedAdminSpeciality,
              selectSpecialityForEditing,
              startNewSpeciality,
              handleSpecialitySave,
              handleDeleteSpeciality,
              primaryActionLabel,
              departmentForm,
              setDepartmentForm,
              selectedDepartment,
              selectDepartmentForEditing,
              startNewDepartment,
              handleDepartmentSave,
              handleDeleteDepartment,
              departmentActionLabel,
              adminDepartments,
              userForm,
              setUserForm,
              selectedAdminUser,
              selectUserForEditing,
              startNewUser,
              handleUserSave,
              userActionLabel,
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
}

function renderActiveSection(props) {
  const { auth, activeSection } = props;

  if (!auth) {
    return null;
  }

  switch (auth.user.role) {
    case 'APPLICANT':
      switch (activeSection) {
        case 'applications':
          return <ApplicantApplicationsSection {...props} />;
        case 'application-create':
          return <ApplicantApplicationCreateSection {...props} />;
        case 'application-details':
          return <ApplicantApplicationDetailsSection {...props} />;
        case 'documents':
          return <ApplicantDocumentsSection {...props} />;
        case 'departments':
          return <DepartmentDirectorySection departments={props.publicDepartments} specialities={props.publicSpecialities} />;
        case 'specialities':
          return <SpecialitiesDirectorySection departments={props.publicDepartments} publicSpecialities={props.publicSpecialities} />;
        case 'profile':
        default:
          return <ApplicantProfileSection {...props} />;
      }
    case 'STAFF':
      switch (activeSection) {
        case 'departments':
          return <DepartmentDirectorySection departments={props.publicDepartments} specialities={props.publicSpecialities} />;
        case 'specialities':
          return <SpecialitiesDirectorySection departments={props.publicDepartments} publicSpecialities={props.publicSpecialities} />;
        case 'queue':
        default:
          return <StaffQueueSection {...props} />;
      }
    case 'ADMIN':
      switch (activeSection) {
        case 'departments':
          return <AdminDepartmentsSection {...props} />;
        case 'specialities':
          return <AdminSpecialitiesSection {...props} />;
        case 'users':
          return <AdminUsersSection {...props} />;
        case 'dashboard':
        default:
          return (
            <AdminDashboardSection
              adminDashboard={props.adminDashboard}
              adminDepartments={props.adminDepartments}
              adminSpecialities={props.adminSpecialities}
            />
          );
      }
    default:
      return null;
  }
}

function ApplicantProfileSection({ profileForm, setProfileForm, handleSaveProfile }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader
          title="Профиль абитуриента"
          text="Данные профиля подставляются в заявки и используются для связи."
        />
        <Stack component="form" spacing={2} onSubmit={handleSaveProfile}>
          <TextField
            label="ФИО"
            value={profileForm.fullName}
            onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={profileForm.email}
            onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
            fullWidth
          />
          <TextField
            label="Телефон"
            value={profileForm.phone}
            onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
            fullWidth
          />
          <Button type="submit" variant="contained" startIcon={<Edit />} sx={{ alignSelf: 'flex-start' }}>
            Сохранить профиль
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ApplicantApplicationsSection({
  applicantApplications,
  selectedApplicantApplication,
  setSelectedApplicantApplicationId,
  setActiveSection,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader
          title="Заявки"
          text="Здесь отображается список ваших заявок. Создание заявки вынесено на отдельный экран."
        />
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setActiveSection('application-create')}>
              Создать заявку
            </Button>
          </Stack>

          <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {applicantApplications.map((application) => (
              <ListItemButton
                key={application.id}
                selected={selectedApplicantApplication?.id === application.id}
                onClick={() => {
                  setSelectedApplicantApplicationId(`${application.id}`);
                  setActiveSection('application-details');
                }}
                sx={{ alignItems: 'flex-start', py: 1.5 }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Заявка №{application.id}
                      </Typography>
                      <StatusChip status={application.status} />
                    </Stack>
                  }
                  secondary={`${application.speciality.department?.name || 'Без отделения'} · ${application.speciality.code} · ${application.speciality.name}`}
                />
              </ListItemButton>
            ))}
            {!applicantApplications.length ? (
              <Box sx={{ p: 2 }}>
                <EmptyState title="Заявок пока нет" text="Нажмите «Создать заявку», чтобы отправить первое заявление." />
              </Box>
            ) : null}
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ApplicantApplicationDetailsSection({
  selectedApplicantApplication,
  setActiveSection,
  handleDownloadDocument,
  handleDeleteDocument,
  handleUploadDocument,
  documentTypes,
}) {
  return (
    <Stack spacing={2.5}>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
              <Box>
                <SectionHeader title="Подробности заявки" text="Полная информация по выбранной записи." />
              </Box>
              <Button variant="outlined" onClick={() => setActiveSection('applications')}>
                К списку заявок
              </Button>
            </Stack>

            {selectedApplicantApplication ? (
              <Stack spacing={2.5}>
                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>
                            Заявка №{selectedApplicantApplication.id}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {selectedApplicantApplication.speciality.department?.name || 'Без отделения'} · {selectedApplicantApplication.speciality.code} · {selectedApplicantApplication.speciality.name}
                          </Typography>
                        </Box>
                        <StatusChip status={selectedApplicantApplication.status} />
                      </Stack>

                      <Grid container spacing={2}>
                        <InfoTile label="Паспорт" value={`${selectedApplicantApplication.passportSeries} ${selectedApplicantApplication.passportNumber}`} />
                        <InfoTile label="СНИЛС" value={selectedApplicantApplication.snils} />
                        <InfoTile label="Аттестат" value={selectedApplicantApplication.educationDocumentNumber} />
                        <InfoTile label="Школа" value={selectedApplicantApplication.graduationSchool} />
                        <InfoTile label="Баллы" value={selectedApplicantApplication.points} />
                        <InfoTile label="Комментарий сотрудника" value={selectedApplicantApplication.staffComment || 'Пока нет замечаний'} />
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent>
                    <SectionHeader title="Документы заявки" text="Файлы, прикрепленные именно к этой заявке." />
                    <Stack spacing={1.5}>
                      {selectedApplicantApplication.documents?.map((document) => (
                        <DocumentRow
                          key={document.id}
                          document={document}
                          onDownload={() => handleDownloadDocument(document.id)}
                          onDelete={() => handleDeleteDocument(document.id)}
                        />
                      ))}
                      {!selectedApplicantApplication.documents?.length ? (
                        <EmptyState title="Пока нет документов" text="Здесь появятся прикрепленные файлы." />
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent>
                    <SectionHeader title="Загрузка документа" text="Добавьте файл к выбранной заявке." />
                    <Box component="form" onSubmit={handleUploadDocument} sx={{ display: 'grid', gap: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField select name="type" label="Тип документа" defaultValue={documentTypes[0].value} fullWidth>
                            {documentTypes.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            sx={{ height: '56px', width: '100%', justifyContent: 'flex-start' }}
                          >
                            Выбрать файл
                            <input name="file" type="file" hidden />
                          </Button>
                        </Grid>
                      </Grid>
                      <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
                        Загрузить
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            ) : (
              <EmptyState title="Нет выбранной заявки" text="Откройте заявку из списка, чтобы посмотреть подробности." />
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

function ApplicantApplicationCreateSection({ applicationForm, setApplicationForm, publicSpecialities, handleCreateApplication }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader
          title="Создание заявки"
          text="Заполните данные абитуриента и выберите специальность для подачи заявления."
        />
        <Stack component="form" spacing={2} onSubmit={handleCreateApplication} sx={{ maxWidth: 760 }}>
          <TextField
            select
            label="Специальность"
            value={applicationForm.specialityId}
            onChange={(event) => setApplicationForm({ ...applicationForm, specialityId: event.target.value })}
            fullWidth
          >
            <MenuItem value="">Выберите специальность</MenuItem>
            {publicSpecialities.map((speciality) => (
              <MenuItem key={speciality.id} value={speciality.id}>
                {speciality.department?.name || 'Без отделения'} · {speciality.code} · {speciality.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Серия паспорта"
            value={applicationForm.passportSeries}
            onChange={(event) => setApplicationForm({ ...applicationForm, passportSeries: event.target.value })}
            fullWidth
          />
          <TextField
            label="Номер паспорта"
            value={applicationForm.passportNumber}
            onChange={(event) => setApplicationForm({ ...applicationForm, passportNumber: event.target.value })}
            fullWidth
          />
          <TextField
            label="СНИЛС"
            value={applicationForm.snils}
            onChange={(event) => setApplicationForm({ ...applicationForm, snils: event.target.value })}
            fullWidth
          />
          <TextField
            label="Номер аттестата"
            value={applicationForm.educationDocumentNumber}
            onChange={(event) => setApplicationForm({ ...applicationForm, educationDocumentNumber: event.target.value })}
            fullWidth
          />
          <TextField
            label="Школа / колледж"
            value={applicationForm.graduationSchool}
            onChange={(event) => setApplicationForm({ ...applicationForm, graduationSchool: event.target.value })}
            fullWidth
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Год окончания"
                type="number"
                value={applicationForm.graduationYear}
                onChange={(event) => setApplicationForm({ ...applicationForm, graduationYear: event.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Баллы"
                type="number"
                value={applicationForm.points}
                onChange={(event) => setApplicationForm({ ...applicationForm, points: event.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>
          <TextField
            label="Комментарий"
            value={applicationForm.applicantComment}
            onChange={(event) => setApplicationForm({ ...applicationForm, applicantComment: event.target.value })}
            multiline
            minRows={3}
            fullWidth
          />
          <Button type="submit" variant="contained" startIcon={<CloudUpload />} sx={{ alignSelf: 'flex-start' }}>
            Отправить заявку
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ApplicantDocumentsSection({ selectedApplicantApplication, handleDownloadDocument, handleDeleteDocument }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader title="Документы" text="Все загруженные файлы прикреплены к выбранной заявке." />
        {selectedApplicantApplication ? (
          <Stack spacing={1.5}>
            {selectedApplicantApplication.documents?.length ? (
              selectedApplicantApplication.documents.map((document) => (
                <DocumentRow
                  key={document.id}
                  document={document}
                  onDownload={() => handleDownloadDocument(document.id)}
                  onDelete={() => handleDeleteDocument(document.id)}
                />
              ))
            ) : (
              <EmptyState
                title="Пока нет документов"
                text="Выберите заявку на вкладке «Заявки» и загрузите паспорт, аттестат или другие файлы."
              />
            )}
          </Stack>
        ) : (
          <EmptyState title="Нет выбранной заявки" text="Сначала создайте заявку, чтобы прикреплять документы." />
        )}
      </CardContent>
    </Card>
  );
}

function DepartmentDirectorySection({ departments, specialities }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader title="Отделения" text="Каждое отделение объединяет связанные специальности и учебные программы." />
        <Grid container spacing={2}>
          {departments.map((department) => (
            <Grid item xs={12} sm={6} lg={4} key={department.id}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2.5, bgcolor: alpha('#fff', 0.9) }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={department.code} size="small" />
                      <Chip
                        label={`${specialities.filter((item) => item.department?.id === department.id).length} спец.`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {department.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {department.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

function SpecialitiesDirectorySection({ departments, publicSpecialities }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader title="Специальности" text="Данные используются и в заявках, и в отчетах." />
        <Grid container spacing={2}>
          {publicSpecialities.map((speciality) => (
            <Grid item xs={12} sm={6} lg={4} key={speciality.id}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2.5, bgcolor: alpha('#fff', 0.9) }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={speciality.department?.name || 'Без отделения'} size="small" />
                      <Chip label={speciality.code} size="small" variant="outlined" />
                      <Chip label={`${speciality.admissionPlan} мест`} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {speciality.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {speciality.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

function StaffQueueSection({
  staffFilter,
  setStaffFilter,
  applications,
  selectedStaffApplication,
  setSelectedStaffApplicationId,
  handleStaffStatusSave,
  statusOptions,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader
          title="Очередь заявок"
          text="Сотрудник видит все обращения и меняет статусы после проверки пакета документов."
        />

        <Tabs
          value={staffFilter}
          onChange={(_, nextFilter) => setStaffFilter(nextFilter)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {statusOptions.map((option) => (
            <Tab key={option.value} value={option.value} label={option.label} />
          ))}
        </Tabs>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              {applications.map((application) => (
                <ListItemButton
                  key={application.id}
                  selected={selectedStaffApplication?.id === application.id}
                  onClick={() => setSelectedStaffApplicationId(`${application.id}`)}
                  sx={{ alignItems: 'flex-start', py: 1.5 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          №{application.id}
                        </Typography>
                        <StatusChip status={application.status} />
                      </Stack>
                    }
                    secondary={application.applicant.fullName}
                  />
                </ListItemButton>
              ))}
              {!applications.length ? (
                <Box sx={{ p: 2 }}>
                  <EmptyState title="Нет заявок" text="Сейчас в очереди нет заявок по выбранному фильтру." />
                </Box>
              ) : null}
            </List>
          </Grid>

          <Grid item xs={12} md={8}>
            {selectedStaffApplication ? (
              <Stack spacing={2.5}>
                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>
                            Заявка №{selectedStaffApplication.id}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {selectedStaffApplication.applicant.fullName}
                          </Typography>
                        </Box>
                        <StatusChip status={selectedStaffApplication.status} />
                      </Stack>

                      <Grid container spacing={2}>
                        <InfoTile
                          label="Специальность"
                          value={`${selectedStaffApplication.speciality.code} · ${selectedStaffApplication.speciality.name}`}
                        />
                        <InfoTile label="Почта" value={selectedStaffApplication.applicant.email} />
                        <InfoTile label="Телефон" value={selectedStaffApplication.applicant.phone} />
                        <InfoTile label="Дата подачи" value={formatDate(selectedStaffApplication.createdAt)} />
                        <InfoTile label="Документов" value={selectedStaffApplication.documents?.length || 0} />
                        <InfoTile label="Баллы" value={selectedStaffApplication.points} />
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent>
                    <SectionHeader
                      title="Смена статуса"
                      text="Укажите итоговый статус и оставьте комментарий по проверке."
                    />
                    <Stack component="form" spacing={2} onSubmit={handleStaffStatusSave}>
                      <TextField select name="status" label="Новый статус" defaultValue={selectedStaffApplication.status} fullWidth>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        name="staffComment"
                        label="Комментарий"
                        defaultValue={selectedStaffApplication.staffComment || ''}
                        multiline
                        minRows={3}
                        fullWidth
                      />
                      <Button type="submit" variant="contained" startIcon={<AssignmentTurnedIn />}>
                        Сохранить статус
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent>
                    <SectionHeader title="Документы" text="Набор файлов, прикрепленных к заявке." />
                    <Stack spacing={1.5}>
                      {selectedStaffApplication.documents?.map((document) => (
                        <DocumentRow key={document.id} document={document} compact />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            ) : (
              <Card variant="outlined" sx={{ borderRadius: 2.5, minHeight: 260 }}>
                <CardContent sx={{ p: 3 }}>
                  <EmptyState title="Выберите заявку" text="Откройте заявку слева, чтобы проверить документы и поменять статус." />
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function AdminDashboardSection({ adminDashboard, adminDepartments, adminSpecialities }) {
  return (
    <Stack spacing={3}>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <SectionHeader
            title="Админ-панель"
            text="Управление отделениями, специальностями, пользователями и общей статистикой приемной комиссии."
          />
          <Grid container spacing={2}>
            <MetricCard label="Пользователей" value={adminDashboard?.totalUsers || 0} />
            <MetricCard label="Абитуриентов" value={adminDashboard?.totalApplicants || 0} />
            <MetricCard label="Отделений" value={adminDepartments?.length || 0} />
            <MetricCard label="Специальностей" value={adminSpecialities?.length || 0} />
            <MetricCard label="Заявок" value={adminDashboard?.totalApplications || 0} />
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}

function AdminDepartmentsSection({
  adminDepartments,
  departmentForm,
  setDepartmentForm,
  selectedDepartment,
  selectDepartmentForEditing,
  startNewDepartment,
  handleDepartmentSave,
  handleDeleteDepartment,
  departmentActionLabel,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title="Отделения"
            text="Создавайте отделения, а затем привязывайте к ним специальности."
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" startIcon={<Add />} onClick={startNewDepartment}>
              Новое отделение
            </Button>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                {adminDepartments.map((department) => (
                  <ListItemButton
                    key={department.id}
                    selected={selectedDepartment?.id === department.id}
                    onClick={() => selectDepartmentForEditing(department)}
                    sx={{ alignItems: 'flex-start', py: 1.5 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {department.code}
                        </Typography>
                      }
                      secondary={department.name}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={7}>
              <Stack component="form" spacing={2} onSubmit={handleDepartmentSave}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Код"
                      value={departmentForm.code}
                      onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Название"
                      value={departmentForm.name}
                      onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Описание"
                      value={departmentForm.description}
                      onChange={(event) => setDepartmentForm({ ...departmentForm, description: event.target.value })}
                      multiline
                      minRows={4}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Button type="submit" variant="contained">
                    {departmentActionLabel}
                  </Button>
                  {selectedDepartment ? (
                    <Button type="button" color="error" variant="outlined" onClick={handleDeleteDepartment} startIcon={<DeleteOutline />}>
                      Удалить отделение
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminSpecialitiesSection({
  adminDepartments,
  adminSpecialities,
  specialityForm,
  setSpecialityForm,
  selectedAdminSpeciality,
  selectSpecialityForEditing,
  startNewSpeciality,
  handleSpecialitySave,
  handleDeleteSpeciality,
  primaryActionLabel,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title="Специальности"
            text="Создавайте и редактируйте специальности внутри отделений."
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" startIcon={<Add />} onClick={startNewSpeciality}>
              Новая специальность
            </Button>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                {adminSpecialities.map((speciality) => (
                  <ListItemButton
                    key={speciality.id}
                    selected={selectedAdminSpeciality?.id === speciality.id}
                    onClick={() => selectSpecialityForEditing(speciality)}
                    sx={{ alignItems: 'flex-start', py: 1.5 }}
                  >
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {speciality.code}
                              </Typography>
                            }
                            secondary={`${speciality.department?.name || 'Без отделения'} · ${speciality.name}`}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={7}>
                    <Stack component="form" spacing={2} onSubmit={handleSpecialitySave}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            select
                            label="Отделение"
                            value={specialityForm.departmentId}
                            onChange={(event) => setSpecialityForm({ ...specialityForm, departmentId: event.target.value })}
                            fullWidth
                          >
                            <MenuItem value="">Выберите отделение</MenuItem>
                            {adminDepartments.map((department) => (
                              <MenuItem key={department.id} value={department.id}>
                                {department.code} · {department.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Код"
                      value={specialityForm.code}
                      onChange={(event) => setSpecialityForm({ ...specialityForm, code: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Название"
                      value={specialityForm.name}
                      onChange={(event) => setSpecialityForm({ ...specialityForm, name: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Бюджетные места"
                      type="number"
                      value={specialityForm.budgetPlaces}
                      onChange={(event) => setSpecialityForm({ ...specialityForm, budgetPlaces: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Платные места"
                      type="number"
                      value={specialityForm.paidPlaces}
                      onChange={(event) => setSpecialityForm({ ...specialityForm, paidPlaces: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="План приема"
                      type="number"
                      value={specialityForm.admissionPlan}
                      onChange={(event) => setSpecialityForm({ ...specialityForm, admissionPlan: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Описание"
                      value={specialityForm.description}
                      onChange={(event) => setSpecialityForm({ ...specialityForm, description: event.target.value })}
                      multiline
                      minRows={4}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Button type="submit" variant="contained">
                    {primaryActionLabel}
                  </Button>
                  {selectedAdminSpeciality ? (
                    <Button type="button" color="error" variant="outlined" onClick={handleDeleteSpeciality} startIcon={<DeleteOutline />}>
                      Удалить специальность
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminUsersSection({
  adminUsers,
  userForm,
  setUserForm,
  selectedAdminUser,
  selectUserForEditing,
  startNewUser,
  handleUserSave,
  userActionLabel,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title="Пользователи"
            text="Создавайте сотрудников, администраторов и корректируйте доступы."
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" startIcon={<Add />} onClick={startNewUser}>
              Новый пользователь
            </Button>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                {adminUsers.map((user) => (
                  <ListItemButton
                    key={user.id}
                    selected={selectedAdminUser?.id === user.id}
                    onClick={() => selectUserForEditing(user)}
                    sx={{ alignItems: 'flex-start', py: 1.5 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {user.fullName}
                        </Typography>
                      }
                      secondary={`${user.username} · ${ROLE_LABELS[user.role]}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={7}>
              <Stack component="form" spacing={2} onSubmit={handleUserSave}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="ФИО"
                      value={userForm.fullName}
                      onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Логин"
                      value={userForm.username}
                      onChange={(event) => setUserForm({ ...userForm, username: event.target.value })}
                      fullWidth
                      InputProps={{ readOnly: Boolean(selectedAdminUser) }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Пароль"
                      type="password"
                      value={userForm.password}
                      onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                      placeholder={selectedAdminUser ? 'Оставьте пустым, если не меняете' : ''}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      type="email"
                      value={userForm.email}
                      onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Телефон"
                      value={userForm.phone}
                      onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      label="Роль"
                      value={userForm.role}
                      onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
                      fullWidth
                    >
                      <MenuItem value="STAFF">Сотрудник</MenuItem>
                      <MenuItem value="ADMIN">Администратор</MenuItem>
                      <MenuItem value="APPLICANT">Абитуриент</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      label="Активность"
                      value={userForm.active ? 'true' : 'false'}
                      onChange={(event) => setUserForm({ ...userForm, active: event.target.value === 'true' })}
                      fullWidth
                    >
                      <MenuItem value="true">Активен</MenuItem>
                      <MenuItem value="false">Отключен</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <Button type="submit" variant="contained">
                  {userActionLabel}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <Grid item xs={12} sm={4}>
      <Card variant="outlined" sx={{ borderRadius: 2.5, height: '100%' }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#1a73e8', 0.12), color: 'primary.main' }}>{icon}</Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {text}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}

function MetricCard({ label, value, tone = 'default' }) {
  const colorMap = {
    default: { bg: alpha('#1a73e8', 0.08), color: 'text.primary' },
    success: { bg: alpha('#34a853', 0.10), color: '#137333' },
    warning: { bg: alpha('#f9ab00', 0.12), color: '#8a4f00' },
    error: { bg: alpha('#ea4335', 0.10), color: '#b3261e' },
  };
  const colors = colorMap[tone] || colorMap.default;

  return (
    <Grid item xs={12} sm={4}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          height: '100%',
          bgcolor: colors.bg,
        }}
      >
        <CardContent sx={{ py: 2.25 }}>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.color, wordBreak: 'break-word' }}>
              {value}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}

function SectionHeader({ title, text }) {
  return (
    <Stack spacing={0.5} sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Stack>
  );
}

function StatusChip({ status }) {
  const chipStyles = {
    SUBMITTED: { label: STATUS_LABELS.SUBMITTED, bg: alpha('#1a73e8', 0.10), color: '#174ea6' },
    UNDER_REVIEW: { label: STATUS_LABELS.UNDER_REVIEW, bg: alpha('#f9ab00', 0.15), color: '#8a4f00' },
    MISSING_DOCS: { label: STATUS_LABELS.MISSING_DOCS, bg: alpha('#ea4335', 0.10), color: '#b3261e' },
    ACCEPTED: { label: STATUS_LABELS.ACCEPTED, bg: alpha('#34a853', 0.12), color: '#137333' },
    REJECTED: { label: STATUS_LABELS.REJECTED, bg: alpha('#ea4335', 0.10), color: '#b3261e' },
  };
  const current = chipStyles[status] || { label: status, bg: alpha('#5f6368', 0.10), color: '#3c4043' };

  return (
    <Chip
      size="small"
      label={current.label}
      sx={{
        bgcolor: current.bg,
        color: current.color,
        fontWeight: 700,
        borderRadius: 999,
      }}
    />
  );
}

function EmptyState({ title, text }) {
  return (
    <Stack spacing={0.75} sx={{ py: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Stack>
  );
}

function InfoTile({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha('#fff', 0.7) }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
            {value || '—'}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

function DocumentRow({ document, onDownload, onDelete, compact = false }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ py: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
              {document.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {document.type} · {formatBytes(document.size)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {onDownload ? (
              <Button size="small" variant="outlined" startIcon={<Download />} onClick={onDownload}>
                Скачать
              </Button>
            ) : null}
            {onDelete ? (
              <Button size="small" color="error" variant="outlined" startIcon={<DeleteOutline />} onClick={onDelete}>
                Удалить
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatBytes(size) {
  if (!size && size !== 0) return '—';
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

export default App;
