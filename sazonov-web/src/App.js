import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  InputAdornment,
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
  Block,
  DeleteOutline,
  Download,
  Edit,
  EmojiEvents,
  Login,
  Logout,
  ManageAccounts,
  Search,
  Assignment,
  Person,
  School,
  Sort,
} from '@mui/icons-material';
import './App.css';
import { api, clearStoredAuth, loadStoredAuth, saveStoredAuth } from './api';

const STATUS_LABELS = {
  SUBMITTED: 'Подана',
  UNDER_REVIEW: 'На проверке',
  MISSING_DOCS: 'Нужны документы',
  ACCEPTED: 'Одобрена',
  REJECTED: 'Отклонена',
  CANCELLED: 'Отменена',
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

const DOCUMENT_TYPE_LABELS = {
  PASSPORT: 'Паспорт',
  EDUCATION_CERTIFICATE: 'Аттестат',
  PHOTO: 'Фотография',
  MEDICAL_CERTIFICATE: 'Медицинская справка',
  SNILS: 'СНИЛС',
  OTHER: 'Другой документ',
};

const REQUIRED_APPLICATION_DOCUMENTS = [
  { value: 'PASSPORT', label: 'Паспорт', hint: 'Скан или фото главной страницы и страницы с регистрацией.' },
  { value: 'EDUCATION_CERTIFICATE', label: 'Аттестат', hint: 'Копия аттестата об окончании школы или колледжа.' },
  { value: 'SNILS', label: 'СНИЛС', hint: 'Файл со СНИЛС для проверки данных.' },
  { value: 'PHOTO', label: 'Фотография', hint: 'Фото абитуриента для личного дела.' },
];

const KANBAN_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'MISSING_DOCS', 'ACCEPTED', 'REJECTED', 'CANCELLED'];

const APPLICATION_SORT_OPTIONS = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'points_desc', label: 'По среднему баллу: больше к меньшему' },
  { value: 'points_asc', label: 'По среднему баллу: меньше к большему' },
  { value: 'name_asc', label: 'По ФИО: А-Я' },
];

const APPLICATION_STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Все статусы' },
  ...KANBAN_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
];

const AVERAGE_SCORE_MIN = 2;
const AVERAGE_SCORE_MAX = 5;
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_SIZE_LABEL = '5 МБ';
const MAX_UPLOAD_FILES_PER_BATCH = 5;

function normalizeAverageScoreInput(value) {
  return `${value ?? ''}`.trim().replace(',', '.');
}

function parseAverageScoreInput(value) {
  const normalized = normalizeAverageScoreInput(value);
  if (!normalized) {
    return Number.NaN;
  }
  return Number(normalized);
}

function formatAverageScore(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '—';
  }
  return numericValue.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isFileWithinLimit(file) {
  return file && file.size <= MAX_UPLOAD_SIZE_BYTES;
}

function getFileSizeLimitMessage(file) {
  return `Файл «${file.name}» превышает ${MAX_UPLOAD_SIZE_LABEL}. Выберите файл меньше или равный ${MAX_UPLOAD_SIZE_LABEL}.`;
}

function getApplicationSearchText(application) {
  return [
    application.id,
    application.status,
    STATUS_LABELS[application.status],
    application.applicant?.fullName,
    application.speciality?.department?.name,
    application.speciality?.code,
    application.speciality?.name,
    application.staffComment,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function sortApplications(items, sortMode) {
  const sorted = [...items];

  switch (sortMode) {
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    case 'points_desc':
      return sorted.sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
    case 'points_asc':
      return sorted.sort((a, b) => Number(a.points || 0) - Number(b.points || 0));
    case 'name_asc':
      return sorted.sort((a, b) => `${a.applicant?.fullName || ''}`.localeCompare(`${b.applicant?.fullName || ''}`, 'ru'));
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
}

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
  points: '',
  applicantComment: '',
};

const emptyApplicationEdit = {
  ...emptyApplication,
};

const emptyApplicationErrors = {
  points: '',
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

const emptyDepartmentErrors = {
  code: '',
  name: '',
  description: '',
};

const emptySpecialityErrors = {
  departmentId: '',
  code: '',
  name: '',
  budgetPlaces: '',
  paidPlaces: '',
  description: '',
};

const emptyUserErrors = {
  fullName: '',
  username: '',
  password: '',
  email: '',
  phone: '',
  role: '',
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
  const [applicationEditForm, setApplicationEditForm] = useState(emptyApplicationEdit);
  const [applicationFormErrors, setApplicationFormErrors] = useState(emptyApplicationErrors);
  const [applicationEditErrors, setApplicationEditErrors] = useState(emptyApplicationErrors);
  const [applicationCreateDocuments, setApplicationCreateDocuments] = useState([]);
  const [applicationCreateDocumentType, setApplicationCreateDocumentType] = useState('PASSPORT');
  const [departmentForm, setDepartmentForm] = useState(emptyDepartment);
  const [specialityForm, setSpecialityForm] = useState(emptySpeciality);
  const [userForm, setUserForm] = useState(emptyUser);

  const [publicDepartments, setPublicDepartments] = useState([]);
  const [publicSpecialities, setPublicSpecialities] = useState([]);
  const [publicDashboard, setPublicDashboard] = useState(null);
  const [publicLeaderboard, setPublicLeaderboard] = useState([]);
  const [applicantApplications, setApplicantApplications] = useState([]);
  const [staffApplications, setStaffApplications] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminDepartments, setAdminDepartments] = useState([]);
  const [adminSpecialities, setAdminSpecialities] = useState([]);
  const [adminDashboard, setAdminDashboard] = useState(null);

  const [selectedApplicantApplicationId, setSelectedApplicantApplicationId] = useState('');
  const [selectedStaffApplicationId, setSelectedStaffApplicationId] = useState('');
  const [selectedLeaderboardSpecialityId, setSelectedLeaderboardSpecialityId] = useState('');
  const [selectedSpecialityId, setSelectedSpecialityId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [creatingSpeciality, setCreatingSpeciality] = useState(false);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [authView, setAuthView] = useState('home');
  const [applicationSearchQuery, setApplicationSearchQuery] = useState('');
  const [applicationSortMode, setApplicationSortMode] = useState('newest');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('ALL');
  const [savingApplicationEdit, setSavingApplicationEdit] = useState(false);
  const [cancellingApplication, setCancellingApplication] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState('');
  const [departmentErrors, setDepartmentErrors] = useState(emptyDepartmentErrors);
  const [specialityErrors, setSpecialityErrors] = useState(emptySpecialityErrors);
  const [userErrors, setUserErrors] = useState(emptyUserErrors);

  const loadPublic = useCallback(async () => {
    try {
      const [departments, specialities, dashboard, leaderboard] = await Promise.all([
        api.publicDepartments(),
        api.publicSpecialities(),
        api.publicDashboard(),
        api.publicLeaderboard(),
      ]);
      setPublicDepartments(departments);
      setPublicSpecialities(specialities);
      setPublicDashboard(dashboard);
      setPublicLeaderboard(leaderboard.specialities || []);
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
          const applications = await api.staffApplications(nextAuth.token);
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
    [auth, loadPublic],
  );

  useEffect(() => {
    const stored = loadStoredAuth();

    (async () => {
      try {
        const [departments, specialities, dashboard, leaderboard] = await Promise.all([
          api.publicDepartments(),
          api.publicSpecialities(),
          api.publicDashboard(),
          api.publicLeaderboard(),
        ]);
        setPublicDepartments(departments);
        setPublicSpecialities(specialities);
        setPublicDashboard(dashboard);
        setPublicLeaderboard(leaderboard.specialities || []);

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
    if (publicLeaderboard.length > 0) {
      if (!selectedLeaderboardSpecialityId || !publicLeaderboard.some((item) => `${item.specialityId}` === `${selectedLeaderboardSpecialityId}`)) {
        setSelectedLeaderboardSpecialityId(`${publicLeaderboard[0].specialityId}`);
      }
    } else {
      setSelectedLeaderboardSpecialityId('');
    }
  }, [publicLeaderboard, selectedLeaderboardSpecialityId]);

  const selectedApplicantApplication = useMemo(
    () => applicantApplications.find((item) => `${item.id}` === `${selectedApplicantApplicationId}`) || null,
    [applicantApplications, selectedApplicantApplicationId],
  );

  const selectedApplicantApplicationCanEdit = useMemo(
    () =>
      Boolean(
        selectedApplicantApplication &&
          !['ACCEPTED', 'REJECTED', 'CANCELLED'].includes(selectedApplicantApplication.status),
      ),
    [selectedApplicantApplication],
  );

  useEffect(() => {
    if (selectedApplicantApplication) {
      setApplicationEditForm({
        specialityId: `${selectedApplicantApplication.speciality?.id || ''}`,
        passportSeries: selectedApplicantApplication.passportSeries || '',
        passportNumber: selectedApplicantApplication.passportNumber || '',
        snils: selectedApplicantApplication.snils || '',
        educationDocumentNumber: selectedApplicantApplication.educationDocumentNumber || '',
        graduationSchool: selectedApplicantApplication.graduationSchool || '',
        graduationYear: selectedApplicantApplication.graduationYear || new Date().getFullYear(),
        points: selectedApplicantApplication.points ?? '',
        applicantComment: selectedApplicantApplication.applicantComment || '',
      });
      setApplicationEditErrors(emptyApplicationErrors);
    } else {
      setApplicationEditForm(emptyApplicationEdit);
      setApplicationEditErrors(emptyApplicationErrors);
    }
  }, [selectedApplicantApplication]);

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

  const applicantUsedSpecialityIds = useMemo(
    () => new Set(applicantApplications.map((item) => `${item.speciality?.id || ''}`)),
    [applicantApplications],
  );

  const availableSpecialitiesForCreate = useMemo(
    () => publicSpecialities.filter((speciality) => !applicantUsedSpecialityIds.has(`${speciality.id}`)),
    [publicSpecialities, applicantUsedSpecialityIds],
  );

  useEffect(() => {
    if (!applicationForm.specialityId && availableSpecialitiesForCreate.length > 0) {
      setApplicationForm((current) => ({
        ...current,
        specialityId: `${availableSpecialitiesForCreate[0].id}`,
      }));
      return;
    }

    if (applicationForm.specialityId && !availableSpecialitiesForCreate.some((item) => `${item.id}` === `${applicationForm.specialityId}`)) {
      setApplicationForm((current) => ({
        ...current,
        specialityId: `${availableSpecialitiesForCreate[0]?.id || ''}`,
      }));
    }
  }, [applicationForm.specialityId, availableSpecialitiesForCreate]);

  const navigationTabs = useMemo(() => {
    if (!auth) {
      return [];
    }

    switch (auth.user.role) {
      case 'APPLICANT':
        return [
          { value: 'profile', label: 'Профиль', icon: <Person fontSize="small" /> },
          { value: 'applications', label: 'Заявки', icon: <Assignment fontSize="small" /> },
          { value: 'leaderboard', label: 'Конкурс', icon: <EmojiEvents fontSize="small" /> },
          { value: 'departments', label: 'Отделения', icon: <School fontSize="small" /> },
        ];
      case 'STAFF':
        return [
          { value: 'queue', label: 'Очередь', icon: <AssignmentTurnedIn fontSize="small" /> },
          { value: 'leaderboard', label: 'Конкурс', icon: <EmojiEvents fontSize="small" /> },
          { value: 'departments', label: 'Отделения', icon: <School fontSize="small" /> },
        ];
      case 'ADMIN':
        return [
          { value: 'dashboard', label: 'Сводка', icon: <Dashboard fontSize="small" /> },
          { value: 'applications', label: 'Заявки', icon: <Assignment fontSize="small" /> },
          { value: 'leaderboard', label: 'Конкурс', icon: <EmojiEvents fontSize="small" /> },
          { value: 'departments', label: 'Отделения', icon: <School fontSize="small" /> },
          { value: 'specialities', label: 'Специальности', icon: <School fontSize="small" /> },
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

    const internalSections = new Set(['application-details', 'application-create', 'department-form', 'user-form', 'speciality-form']);

    if (navigationTabs.length === 0) {
      setActiveSection('');
      return;
    }

    if (
      !internalSections.has(activeSection) &&
      !navigationTabs.some((item) => item.value === activeSection)
    ) {
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
    setAuthView('home');
    setApplicantApplications([]);
    setStaffApplications([]);
    setAdminUsers([]);
    setAdminDepartments([]);
    setAdminSpecialities([]);
    setAdminDashboard(null);
    setPublicDepartments([]);
    setPublicLeaderboard([]);
    setApplicationCreateDocuments([]);
    setApplicationCreateDocumentType('PASSPORT');
    setApplicationForm(emptyApplication);
    setApplicationEditForm(emptyApplicationEdit);
    setApplicationFormErrors(emptyApplicationErrors);
    setApplicationEditErrors(emptyApplicationErrors);
    setSelectedApplicantApplicationId('');
    setSelectedStaffApplicationId('');
    setSelectedLeaderboardSpecialityId('');
    setSelectedSpecialityId('');
    setSelectedUserId('');
    setSelectedDepartmentId('');
    setSavingApplicationEdit(false);
    setCancellingApplication(false);
    setApplicationSearchQuery('');
    setApplicationSortMode('newest');
    setApplicationStatusFilter('ALL');
    setDepartmentErrors(emptyDepartmentErrors);
    setSpecialityErrors(emptySpecialityErrors);
    setUserErrors(emptyUserErrors);
    setMessage('Сеанс завершён');
    await loadPublic();
  }

  function validateDepartmentForm(form) {
    const nextErrors = { ...emptyDepartmentErrors };
    if (!form.code.trim()) {
      nextErrors.code = 'Укажите код отделения';
    }
    if (!form.name.trim()) {
      nextErrors.name = 'Укажите название отделения';
    }
    setDepartmentErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }

  function validateApplicationPoints(form, setNextErrors) {
    const nextErrors = { ...emptyApplicationErrors };
    const normalizedPoints = normalizeAverageScoreInput(form.points);

    if (!normalizedPoints) {
      nextErrors.points = 'Укажите средний балл от 2 до 5';
      setNextErrors(nextErrors);
      return false;
    }

    const points = Number(normalizedPoints);
    if (!Number.isFinite(points)) {
      nextErrors.points = 'Введите число от 2 до 5';
    } else if (points < AVERAGE_SCORE_MIN || points > AVERAGE_SCORE_MAX) {
      nextErrors.points = 'Средний балл должен быть от 2 до 5';
    } else if ((normalizedPoints.split('.')[1] || '').length > 2) {
      nextErrors.points = 'Можно указать не более 2 знаков после запятой';
    }

    setNextErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }

  function validateSpecialityForm(form) {
    const nextErrors = { ...emptySpecialityErrors };
    if (!form.departmentId) {
      nextErrors.departmentId = 'Выберите отделение';
    }
    if (!form.code.trim()) {
      nextErrors.code = 'Укажите код специальности';
    }
    if (!form.name.trim()) {
      nextErrors.name = 'Укажите название специальности';
    }
    if (form.budgetPlaces === '' || Number.isNaN(Number(form.budgetPlaces)) || Number(form.budgetPlaces) < 0) {
      nextErrors.budgetPlaces = 'Введите число 0 или больше';
    }
    if (form.paidPlaces === '' || Number.isNaN(Number(form.paidPlaces)) || Number(form.paidPlaces) < 0) {
      nextErrors.paidPlaces = 'Введите число 0 или больше';
    }
    setSpecialityErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }

  function validateUserForm(form, isUpdate) {
    const nextErrors = { ...emptyUserErrors };
    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Укажите ФИО';
    }
    if (!form.username.trim()) {
      nextErrors.username = 'Укажите логин';
    } else if (form.username.trim().length < 3 || form.username.trim().length > 50) {
      nextErrors.username = 'Логин должен быть от 3 до 50 символов';
    }
    if (!isUpdate || form.password.trim()) {
      if (!form.password.trim()) {
        nextErrors.password = 'Укажите пароль';
      } else if (form.password.trim().length < 6) {
        nextErrors.password = 'Пароль должен быть не короче 6 символов';
      }
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Укажите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Введите корректный email';
    }
    if (!form.phone.trim()) {
      nextErrors.phone = 'Укажите телефон';
    }
    if (!form.role) {
      nextErrors.role = 'Выберите роль';
    }
    setUserErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
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

    if (!validateApplicationPoints(applicationForm, setApplicationFormErrors)) {
      return;
    }

    if (!availableSpecialitiesForCreate.some((item) => `${item.id}` === `${applicationForm.specialityId}`)) {
      setError('Эта специальность уже занята. Выберите другую.');
      return;
    }

    const oversizedFile = applicationCreateDocuments.find((file) => !isFileWithinLimit(file));
    if (oversizedFile) {
      setError(getFileSizeLimitMessage(oversizedFile));
      return;
    }

    try {
      const created = await api.applicantCreateApplication(auth.token, {
        ...applicationForm,
        specialityId: Number(applicationForm.specialityId),
        graduationYear: Number(applicationForm.graduationYear),
        points: Number(parseAverageScoreInput(applicationForm.points).toFixed(2)),
      });

      for (const file of applicationCreateDocuments) {
        if (!isFileWithinLimit(file)) {
          throw new Error(getFileSizeLimitMessage(file));
        }
        await api.uploadDocument(auth.token, created.id, applicationCreateDocumentType, file);
      }

      setMessage(`Заявка №${created.id} создана`);
      setApplicationForm({
        ...emptyApplication,
        specialityId: applicationForm.specialityId || `${publicSpecialities[0]?.id || ''}`,
      });
      setApplicationFormErrors(emptyApplicationErrors);
      setApplicationCreateDocuments([]);
      setApplicationCreateDocumentType('PASSPORT');
      const applications = await api.applicantApplications(auth.token);
      setApplicantApplications(applications);
      setSelectedApplicantApplicationId(`${created.id}`);
      setActiveSection('application-details');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleUpdateApplication(event) {
    event.preventDefault();
    if (!auth || !selectedApplicantApplication) return;

    setError('');
    setMessage('');
    setSavingApplicationEdit(true);

    if (!validateApplicationPoints(applicationEditForm, setApplicationEditErrors)) {
      setSavingApplicationEdit(false);
      return;
    }

    if (
      `${applicationEditForm.specialityId}` !== `${selectedApplicantApplication.speciality?.id || ''}` &&
      applicantUsedSpecialityIds.has(`${applicationEditForm.specialityId}`)
    ) {
      setSavingApplicationEdit(false);
      setError('Эта специальность уже занята другой вашей заявкой.');
      return;
    }

    try {
      const updated = await api.applicantUpdateApplication(auth.token, selectedApplicantApplication.id, {
        ...applicationEditForm,
        specialityId: Number(applicationEditForm.specialityId),
        graduationYear: Number(applicationEditForm.graduationYear),
        points: Number(parseAverageScoreInput(applicationEditForm.points).toFixed(2)),
      });

      const applications = await api.applicantApplications(auth.token);
      setApplicantApplications(applications);
      setSelectedApplicantApplicationId(`${updated.id}`);
      setApplicationEditErrors(emptyApplicationErrors);
      setMessage(`Заявка №${updated.id} обновлена`);
      setActiveSection('application-details');
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSavingApplicationEdit(false);
    }
  }

  async function handleCancelApplication() {
    if (!auth || !selectedApplicantApplication) return;
    if (!window.confirm(`Отменить заявку №${selectedApplicantApplication.id}?`)) {
      return;
    }

    setError('');
    setMessage('');
    setCancellingApplication(true);

    try {
      const cancelled = await api.applicantCancelApplication(auth.token, selectedApplicantApplication.id);
      const applications = await api.applicantApplications(auth.token);
      setApplicantApplications(applications);
      setSelectedApplicantApplicationId(`${cancelled.id}`);
      setMessage(`Заявка №${cancelled.id} отменена`);
      setActiveSection('application-details');
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setCancellingApplication(false);
    }
  }

  async function handleUploadDocument(event) {
    event.preventDefault();
    if (!auth || !selectedApplicantApplicationId) return;
    const files = Array.from(event.currentTarget.elements.documentFiles?.files || []);
    const type = event.currentTarget.elements.type?.value;
    if (!files.length) {
      setError('Выберите от 1 до 5 файлов');
      return;
    }
    if (files.length > MAX_UPLOAD_FILES_PER_BATCH) {
      setError(`Можно загрузить не больше ${MAX_UPLOAD_FILES_PER_BATCH} файлов за раз`);
      return;
    }

    setError('');
    setMessage('');

    try {
      const oversizedFile = files.find((file) => !isFileWithinLimit(file));
      if (oversizedFile) {
        throw new Error(getFileSizeLimitMessage(oversizedFile));
      }
      for (const file of files) {
        await api.uploadDocument(auth.token, selectedApplicantApplicationId, type, file);
      }
      const applications = await api.applicantApplications(auth.token);
      setApplicantApplications(applications);
      setMessage(files.length === 1 ? 'Документ загружен' : `Загружено файлов: ${files.length}`);
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

  async function updateApplicationStatus(applicationId, nextStatus, staffComment = '') {
    if (!auth) return;
    setError('');
    setMessage('');
    setUpdatingApplicationId(`${applicationId}`);

    try {
      await api.staffUpdateStatus(auth.token, applicationId, {
        status: nextStatus,
        staffComment,
      });
      const applications = await api.staffApplications(auth.token);
      setStaffApplications(applications);
      setMessage('Статус заявки обновлён');
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setUpdatingApplicationId('');
    }
  }

  async function handleStaffStatusSave(event) {
    event.preventDefault();
    if (!auth || !selectedStaffApplication) return;
    const form = new FormData(event.currentTarget);
    await updateApplicationStatus(selectedStaffApplication.id, form.get('status'), form.get('staffComment'));
  }

  async function handleSpecialitySave(event) {
    event.preventDefault();
    if (!auth || auth.user.role !== 'ADMIN') return;
    setError('');
    setMessage('');

    if (!validateSpecialityForm(specialityForm)) {
      setError('Проверьте поля формы специальности');
      return;
    }

    try {
      const payload = {
        ...specialityForm,
        departmentId: Number(specialityForm.departmentId),
        budgetPlaces: Number(specialityForm.budgetPlaces),
        paidPlaces: Number(specialityForm.paidPlaces),
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
        });
      }
      setActiveSection('specialities');
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
        });
      } else {
        setCreatingSpeciality(false);
        setSelectedSpecialityId('');
        setSpecialityForm(emptySpeciality);
      }
      setActiveSection('specialities');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleUserSave(event) {
    event.preventDefault();
    if (!auth || auth.user.role !== 'ADMIN') return;
    setError('');
    setMessage('');

    if (!validateUserForm(userForm, Boolean(selectedAdminUser))) {
      setError('Проверьте поля формы пользователя');
      return;
    }

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
      setActiveSection('users');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  function selectSpecialityForEditing(speciality) {
    setCreatingSpeciality(false);
    setSelectedSpecialityId(`${speciality.id}`);
    setSpecialityErrors(emptySpecialityErrors);
    setSpecialityForm({
      departmentId: `${speciality.department?.id || ''}`,
      code: speciality.code,
      name: speciality.name,
      description: speciality.description || '',
      budgetPlaces: speciality.budgetPlaces,
      paidPlaces: speciality.paidPlaces,
    });
    setActiveSection('speciality-form');
  }

  function selectUserForEditing(user) {
    setCreatingUser(false);
    setSelectedUserId(`${user.id}`);
    setUserErrors(emptyUserErrors);
    setUserForm({
      fullName: user.fullName,
      username: user.username,
      password: '',
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
    });
    setActiveSection('user-form');
  }

  function startNewSpeciality() {
    setCreatingSpeciality(true);
    setSelectedSpecialityId('');
    setSpecialityErrors(emptySpecialityErrors);
    setSpecialityForm({
      ...emptySpeciality,
      departmentId: selectedDepartment?.id ? `${selectedDepartment.id}` : `${adminDepartments[0]?.id || ''}`,
    });
    setActiveSection('speciality-form');
  }

  async function handleDepartmentSave(event) {
    event.preventDefault();
    if (!auth || auth.user.role !== 'ADMIN') return;
    setError('');
    setMessage('');

    if (!validateDepartmentForm(departmentForm)) {
      setError('Проверьте поля формы отделения');
      return;
    }

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
      setActiveSection('departments');
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
      setActiveSection('departments');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  function selectDepartmentForEditing(department) {
    setCreatingDepartment(false);
    setSelectedDepartmentId(`${department.id}`);
    setDepartmentErrors(emptyDepartmentErrors);
    setDepartmentForm({
      code: department.code,
      name: department.name,
      description: department.description || '',
    });
    setActiveSection('department-form');
  }

  function startNewDepartment() {
    setCreatingDepartment(true);
    setSelectedDepartmentId('');
    setDepartmentErrors(emptyDepartmentErrors);
    setDepartmentForm(emptyDepartment);
    setActiveSection('department-form');
  }

  function startNewUser() {
    setCreatingUser(true);
    setSelectedUserId('');
    setUserErrors(emptyUserErrors);
    setUserForm(emptyUser);
    setActiveSection('user-form');
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
                <Button variant="contained" color="inherit" startIcon={<Logout />} onClick={handleLogout} sx={{ borderRadius: 2 }}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={mode === 'login' ? 'contained' : 'text'}
                  startIcon={<Login />}
                  onClick={() => {
                    setAuthView('auth');
                    setMode('login');
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  Вход
                </Button>
                <Button
                  variant={mode === 'register' ? 'contained' : 'text'}
                  startIcon={<ManageAccounts />}
                  onClick={() => {
                    setAuthView('auth');
                    setMode('register');
                  }}
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
          <AuthSection
            authView={authView}
            setAuthView={setAuthView}
            mode={mode}
            setMode={setMode}
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            handleLogin={handleLogin}
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            handleRegister={handleRegister}
            publicDepartments={publicDepartments}
            publicSpecialities={publicSpecialities}
            publicDashboard={publicDashboard}
          />
        ) : (
          <Stack spacing={3}>
            {renderActiveSection({
              auth,
              activeSection,
              profileForm,
              setProfileForm,
              handleSaveProfile,
              applicationForm,
              setApplicationForm,
              applicationFormErrors,
              setError,
              applicationCreateDocuments,
              setApplicationCreateDocuments,
              applicationCreateDocumentType,
              setApplicationCreateDocumentType,
              publicDepartments,
              publicSpecialities,
              applicantUsedSpecialityIds,
              availableSpecialitiesForCreate,
              publicLeaderboard,
              applicantApplications,
              selectedApplicantApplication,
              selectedApplicantApplicationCanEdit,
              setSelectedApplicantApplicationId,
              selectedLeaderboardSpecialityId,
              setSelectedLeaderboardSpecialityId,
              setActiveSection,
              handleCreateApplication,
              handleUpdateApplication,
              handleCancelApplication,
              handleUploadDocument,
              handleDeleteDocument,
              handleDownloadDocument,
              applicationEditForm,
              setApplicationEditForm,
              applicationEditErrors,
              savingApplicationEdit,
              cancellingApplication,
              updateApplicationStatus,
              handleStaffStatusSave,
              documentTypes: DOCUMENT_TYPES,
              applications: staffApplications,
              selectedStaffApplication,
              setSelectedStaffApplicationId,
              adminDashboard,
              adminSpecialities,
              adminUsers,
              specialityForm,
              setSpecialityForm,
              specialityErrors,
              selectedAdminSpeciality,
              selectSpecialityForEditing,
              startNewSpeciality,
              handleSpecialitySave,
              handleDeleteSpeciality,
              primaryActionLabel,
              departmentForm,
              setDepartmentForm,
              departmentErrors,
              selectedDepartment,
              selectDepartmentForEditing,
              startNewDepartment,
              handleDepartmentSave,
              handleDeleteDepartment,
              departmentActionLabel,
              adminDepartments,
              userForm,
              setUserForm,
              userErrors,
              selectedAdminUser,
              selectUserForEditing,
              startNewUser,
              handleUserSave,
              userActionLabel,
              updatingApplicationId,
              authView,
              setAuthView,
              applicationSearchQuery,
              setApplicationSearchQuery,
              applicationSortMode,
              setApplicationSortMode,
              applicationStatusFilter,
              setApplicationStatusFilter,
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
            return <ApplicantApplicationDetailsSection {...props} viewerRole="APPLICANT" />;
          case 'leaderboard':
            return <LeaderboardSection {...props} />;
          case 'departments':
            return (
              <DepartmentDirectorySection
                auth={props.auth}
                departments={props.publicDepartments}
                specialities={props.publicSpecialities}
                applicantApplications={props.applicantApplications}
                setApplicationForm={props.setApplicationForm}
                setActiveSection={props.setActiveSection}
                setSelectedApplicantApplicationId={props.setSelectedApplicantApplicationId}
              />
            );
          case 'profile':
          default:
            return <ApplicantProfileSection {...props} />;
        }
      case 'STAFF':
        switch (activeSection) {
          case 'departments':
            return (
              <DepartmentDirectorySection
                auth={props.auth}
                departments={props.publicDepartments}
                specialities={props.publicSpecialities}
                applicantApplications={props.applicantApplications}
                setApplicationForm={props.setApplicationForm}
                setActiveSection={props.setActiveSection}
                setSelectedApplicantApplicationId={props.setSelectedApplicantApplicationId}
              />
            );
          case 'application-details':
            return (
              <ApplicantApplicationDetailsSection
                auth={props.auth}
                selectedApplicantApplication={props.selectedStaffApplication}
                selectedApplicantApplicationCanEdit={false}
                setActiveSection={props.setActiveSection}
                viewerRole={auth.user.role}
                handleStaffStatusSave={props.handleStaffStatusSave}
                handleDownloadDocument={props.handleDownloadDocument}
                handleDeleteDocument={props.handleDeleteDocument}
                handleUploadDocument={props.handleUploadDocument}
                documentTypes={props.documentTypes}
              />
            );
          case 'leaderboard':
            return <LeaderboardSection {...props} />;
          case 'queue':
          default:
            return <StaffQueueSection {...props} />;
        }
      case 'ADMIN':
        switch (activeSection) {
          case 'applications':
            return <StaffQueueSection {...props} />;
          case 'departments':
            return <AdminDepartmentsSection {...props} />;
          case 'department-form':
            return <AdminDepartmentFormSection {...props} />;
          case 'specialities':
            return <AdminSpecialitiesSection {...props} />;
          case 'speciality-form':
            return <AdminSpecialityFormSection {...props} />;
          case 'application-details':
            return (
              <ApplicantApplicationDetailsSection
                auth={props.auth}
                selectedApplicantApplication={props.selectedStaffApplication}
                selectedApplicantApplicationCanEdit={false}
                setActiveSection={props.setActiveSection}
                viewerRole={auth.user.role}
                handleStaffStatusSave={props.handleStaffStatusSave}
                handleDownloadDocument={props.handleDownloadDocument}
                handleDeleteDocument={props.handleDeleteDocument}
                handleUploadDocument={props.handleUploadDocument}
                documentTypes={props.documentTypes}
              />
            );
          case 'leaderboard':
            return <LeaderboardSection {...props} />;
          case 'users':
            return <AdminUsersSection {...props} />;
          case 'user-form':
            return <AdminUserFormSection {...props} />;
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

function AuthSection({
  authView,
  setAuthView,
  mode,
  setMode,
  loginForm,
  setLoginForm,
  handleLogin,
  registerForm,
  setRegisterForm,
  handleRegister,
  publicDepartments,
  publicSpecialities,
  publicDashboard,
}) {
  if (authView === 'home') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
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
              <Button variant="contained" startIcon={<Login />} onClick={() => setAuthView('auth')} sx={{ borderRadius: 2 }}>
                Войти
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Авторизация
            </Typography>
            <Button variant="text" onClick={() => setAuthView('home')}>
              На главную
            </Button>
          </Stack>

          <Tabs
            value={mode}
            onChange={(_, nextMode) => setMode(nextMode)}
            textColor="primary"
            indicatorColor="primary"
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
                placeholder="Логин"
                fullWidth
              />
              <TextField
                label="Пароль"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                placeholder="Пароль"
                fullWidth
              />
              <Button type="submit" variant="contained" startIcon={<Login />} sx={{ alignSelf: 'flex-start' }}>
                Войти
              </Button>
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
        </Stack>
      </CardContent>
    </Card>
  );
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
  applicationSearchQuery,
  setApplicationSearchQuery,
  applicationSortMode,
  setApplicationSortMode,
  applicationStatusFilter,
  setApplicationStatusFilter,
}) {
  const visibleApplications = useMemo(() => {
    const query = applicationSearchQuery.trim().toLowerCase();
    let items = applicantApplications.filter((application) => {
      if (applicationStatusFilter !== 'ALL' && application.status !== applicationStatusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return getApplicationSearchText(application).includes(query);
    });

    return sortApplications(items, applicationSortMode);
  }, [applicantApplications, applicationSearchQuery, applicationSortMode, applicationStatusFilter]);

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

          <ApplicationsFiltersBar
            searchValue={applicationSearchQuery}
            onSearchChange={setApplicationSearchQuery}
            sortValue={applicationSortMode}
            onSortChange={setApplicationSortMode}
            statusValue={applicationStatusFilter}
            onStatusChange={setApplicationStatusFilter}
            showStatusFilter
            statusFilterLabel="Фильтр по статусу"
            helperText="Поиск работает по ФИО, специальности, отделению, статусу и номеру заявки."
          />

          <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {visibleApplications.map((application) => (
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
            {!visibleApplications.length ? (
              <Box sx={{ p: 2 }}>
                <EmptyState
                  title={applicantApplications.length ? 'Ничего не найдено' : 'Заявок пока нет'}
                  text={
                    applicantApplications.length
                      ? 'Попробуйте изменить поиск, сортировку или фильтр по статусу.'
                      : 'Нажмите «Создать заявку», чтобы отправить первое заявление.'
                  }
                />
              </Box>
            ) : null}
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ApplicantApplicationDetailsSection({
  auth,
  selectedApplicantApplication,
  selectedApplicantApplicationCanEdit,
  setActiveSection,
  viewerRole,
  applicantUsedSpecialityIds,
  publicSpecialities,
  applicationEditForm,
  setApplicationEditForm,
  applicationEditErrors,
  handleUpdateApplication,
  handleCancelApplication,
  handleStaffStatusSave,
  handleDownloadDocument,
  handleDeleteDocument,
  handleUploadDocument,
  documentTypes,
  savingApplicationEdit,
  cancellingApplication,
  updatingApplicationId,
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
              <Button
                variant="outlined"
                onClick={() => setActiveSection(viewerRole === 'STAFF' ? 'queue' : 'applications')}
              >
                К списку заявок
              </Button>
            </Stack>

            {selectedApplicantApplication ? (
              <Stack spacing={2.5}>
                {viewerRole !== 'APPLICANT' ? (
                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent>
                    <SectionHeader
                      title="Смена статуса"
                      text="Перетаскивание карточек в канбане меняет статус, а здесь можно внести статус и комментарий вручную."
                    />
                    <Stack component="form" spacing={2} onSubmit={handleStaffStatusSave}>
                      <TextField select name="status" label="Новый статус" defaultValue={selectedApplicantApplication.status} fullWidth>
                        {KANBAN_STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                        name="staffComment"
                        label="Комментарий"
                        defaultValue={selectedApplicantApplication.staffComment || ''}
                        multiline
                        minRows={3}
                        fullWidth
                      />
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={
                            updatingApplicationId === `${selectedApplicantApplication.id}` ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <AssignmentTurnedIn />
                            )
                          }
                          disabled={updatingApplicationId === `${selectedApplicantApplication.id}`}
                        >
                          {updatingApplicationId === `${selectedApplicantApplication.id}` ? 'Сохраняем...' : 'Сохранить статус'}
                        </Button>
                    </Stack>
                  </CardContent>
                </Card>
                ) : null}

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
                        <InfoTile label="Средний балл в аттестате" value={formatAverageScore(selectedApplicantApplication.points)} />
                        <InfoTile label="Комментарий сотрудника" value={selectedApplicantApplication.staffComment || 'Пока нет замечаний'} />
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>

                {(() => {
                  const uploadedTypes = new Set((selectedApplicantApplication.documents || []).map((document) => document.type));
                  const missingRequiredDocuments = REQUIRED_APPLICATION_DOCUMENTS.filter(
                    (document) => !uploadedTypes.has(document.value),
                  );

                  return (
                    <Alert
                      severity={missingRequiredDocuments.length ? 'warning' : 'success'}
                      variant="outlined"
                      sx={{ borderRadius: 2.5 }}
                    >
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {missingRequiredDocuments.length
                            ? 'Нужно обязательно загрузить документы'
                            : 'Все обязательные документы загружены'}
                        </Typography>
                        {missingRequiredDocuments.length ? (
                          <Stack spacing={1}>
                            {missingRequiredDocuments.map((document) => (
                              <Box key={document.value} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip size="small" color="warning" variant="outlined" label={document.label} />
                                <Typography variant="body2" color="text.secondary">
                                  {document.hint}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2">
                            Паспорт, аттестат, СНИЛС и фотография уже прикреплены к заявке.
                          </Typography>
                        )}
                      </Stack>
                    </Alert>
                  );
                })()}

                {viewerRole === 'APPLICANT' ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <SectionHeader
                        title="Редактирование заявки"
                        text="Можно изменить данные заявки до её окончательного рассмотрения."
                      />

                      {selectedApplicantApplicationCanEdit ? (
                        <Stack component="form" spacing={2} onSubmit={handleUpdateApplication}>
                          <TextField
                            select
                            label="Специальность"
                            value={applicationEditForm.specialityId}
                            onChange={(event) =>
                              setApplicationEditForm({ ...applicationEditForm, specialityId: event.target.value })
                            }
                            fullWidth
                          >
                            <MenuItem value="">Выберите специальность</MenuItem>
                            {publicSpecialities.map((speciality) => (
                              <MenuItem
                                key={speciality.id}
                                value={speciality.id}
                                disabled={
                                  `${speciality.id}` !== `${selectedApplicantApplication.speciality?.id || ''}` &&
                                  applicantUsedSpecialityIds.has(`${speciality.id}`)
                                }
                              >
                                {speciality.department?.name || 'Без отделения'} · {speciality.code} · {speciality.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <Typography variant="body2" color="text.secondary">
                            Нельзя выбрать специальность, на которую вы уже подавали заявку.
                          </Typography>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Серия паспорта"
                                value={applicationEditForm.passportSeries}
                                onChange={(event) =>
                                  setApplicationEditForm({ ...applicationEditForm, passportSeries: event.target.value })
                                }
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Номер паспорта"
                                value={applicationEditForm.passportNumber}
                                onChange={(event) =>
                                  setApplicationEditForm({ ...applicationEditForm, passportNumber: event.target.value })
                                }
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="СНИЛС"
                                value={applicationEditForm.snils}
                                onChange={(event) => setApplicationEditForm({ ...applicationEditForm, snils: event.target.value })}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Номер аттестата"
                                value={applicationEditForm.educationDocumentNumber}
                                onChange={(event) =>
                                  setApplicationEditForm({
                                    ...applicationEditForm,
                                    educationDocumentNumber: event.target.value,
                                  })
                                }
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Школа / колледж"
                                value={applicationEditForm.graduationSchool}
                                onChange={(event) =>
                                  setApplicationEditForm({ ...applicationEditForm, graduationSchool: event.target.value })
                                }
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Год окончания"
                                type="number"
                                value={applicationEditForm.graduationYear}
                                onChange={(event) =>
                                  setApplicationEditForm({ ...applicationEditForm, graduationYear: event.target.value })
                                }
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                            <TextField
                              label="Средний балл в аттестате"
                              type="text"
                              inputMode="decimal"
                              value={applicationEditForm.points}
                              onChange={(event) =>
                                setApplicationEditForm({ ...applicationEditForm, points: event.target.value })
                              }
                              error={Boolean(applicationEditErrors.points)}
                              helperText={applicationEditErrors.points || 'Допустимо значение от 2.00 до 5.00'}
                              inputProps={{ min: AVERAGE_SCORE_MIN, max: AVERAGE_SCORE_MAX, step: '0.01' }}
                              fullWidth
                            />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Комментарий"
                                value={applicationEditForm.applicantComment}
                                onChange={(event) =>
                                  setApplicationEditForm({ ...applicationEditForm, applicantComment: event.target.value })
                                }
                                multiline
                                minRows={3}
                                fullWidth
                              />
                            </Grid>
                          </Grid>

                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Button type="submit" variant="contained" startIcon={<Edit />} disabled={savingApplicationEdit}>
                              {savingApplicationEdit ? 'Сохранение...' : 'Сохранить изменения'}
                            </Button>
                            <Button
                              type="button"
                              color="error"
                              variant="outlined"
                              startIcon={<Block />}
                              onClick={handleCancelApplication}
                              disabled={cancellingApplication}
                            >
                              {cancellingApplication ? 'Отмена...' : 'Отменить заявку'}
                            </Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <Alert severity="info" variant="outlined">
                          Эту заявку уже нельзя редактировать. Изменение данных доступно только до финального решения.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent>
                    <SectionHeader title="Документы заявки" text="Файлы, прикрепленные именно к этой заявке." />
                    <Stack spacing={1.5}>
                      {selectedApplicantApplication.documents?.map((document) => (
                        <DocumentRow
                          key={document.id}
                          document={document}
                          compact={viewerRole !== 'APPLICANT'}
                          onDownload={() => handleDownloadDocument(document.id)}
                          onDelete={viewerRole === 'APPLICANT' ? () => handleDeleteDocument(document.id) : undefined}
                        />
                      ))}
                      {!selectedApplicantApplication.documents?.length ? (
                        <EmptyState title="Пока нет документов" text="Здесь появятся прикрепленные файлы." />
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>

                {viewerRole === 'APPLICANT' ? (
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
                              Выбрать файлы
                              <input
                                name="documentFiles"
                                type="file"
                                hidden
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                              />
                            </Button>
                          </Grid>
                        </Grid>
                        <Typography variant="caption" color="text.secondary">
                          Максимум {MAX_UPLOAD_FILES_PER_BATCH} файлов за раз, каждый до {MAX_UPLOAD_SIZE_LABEL}
                        </Typography>
                        <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>
                          Загрузить
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ) : null}

                <ApplicationChatSection
                  auth={auth}
                  applicationId={selectedApplicantApplication.id}
                  currentUsername={auth.user.username}
                  title="Чат заявки"
                  text="В этом чате могут писать абитуриент этой заявки, сотрудники и администраторы."
                />
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

function ApplicantApplicationCreateSection({
  applicationForm,
  setApplicationForm,
  applicationFormErrors,
  setError,
  applicationCreateDocuments,
  setApplicationCreateDocuments,
  applicationCreateDocumentType,
  setApplicationCreateDocumentType,
  availableSpecialitiesForCreate,
  handleCreateApplication,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader
          title="Создание заявки"
          text="Заполните данные абитуриента и выберите специальность для подачи заявления."
        />
        <Stack component="form" spacing={2.5} onSubmit={handleCreateApplication} sx={{ maxWidth: 760 }}>
          <TextField
            select
            label="Специальность"
            value={applicationForm.specialityId}
                          onChange={(event) => setApplicationForm({ ...applicationForm, specialityId: event.target.value })}
                          fullWidth
                        >
                          <MenuItem value="">Выберите специальность</MenuItem>
            {availableSpecialitiesForCreate.map((speciality) => (
              <MenuItem key={speciality.id} value={speciality.id}>
                {speciality.department?.name || 'Без отделения'} · {speciality.code} · {speciality.name}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" color="text.secondary">
            Можно выбрать только свободную специальность. Уже занятые варианты скрыты.
          </Typography>
          {!availableSpecialitiesForCreate.length ? (
            <Alert severity="warning" variant="outlined">
              У вас уже есть заявка по каждой доступной специальности. Новую заявку создать нельзя.
            </Alert>
          ) : null}
          <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Документы для заявки
                </Typography>
                <TextField
                  select
                  label="Тип документов"
                  value={applicationCreateDocumentType}
                  onChange={(event) => setApplicationCreateDocumentType(event.target.value)}
                  fullWidth
                >
                  <MenuItem value="PASSPORT">Паспорт</MenuItem>
                  <MenuItem value="EDUCATION_CERTIFICATE">Аттестат</MenuItem>
                  <MenuItem value="PHOTO">Фотография</MenuItem>
                  <MenuItem value="MEDICAL_CERTIFICATE">Медицинская справка</MenuItem>
                  <MenuItem value="SNILS">СНИЛС</MenuItem>
                  <MenuItem value="OTHER">Другой документ</MenuItem>
                </TextField>
                <Button component="label" variant="outlined" startIcon={<CloudUpload />} sx={{ alignSelf: 'flex-start' }}>
                  Выбрать файлы
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(event) => {
                      const nextFiles = Array.from(event.target.files || []);
                      const tooLargeFile = nextFiles.find((file) => !isFileWithinLimit(file));
                      if (tooLargeFile) {
                        setError(getFileSizeLimitMessage(tooLargeFile));
                      } else {
                        setError('');
                      }
                      setApplicationCreateDocuments(nextFiles.filter(isFileWithinLimit));
                    }}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {applicationCreateDocuments.length
                    ? `Выбрано файлов: ${applicationCreateDocuments.length}`
                    : `Файлы можно прикрепить сразу при создании заявки. Максимум ${MAX_UPLOAD_SIZE_LABEL} на файл.`}
                </Typography>
                {applicationCreateDocuments.length ? (
                  <Stack spacing={0.5}>
                    {applicationCreateDocuments.map((file) => (
                      <Typography key={`${file.name}-${file.size}`} variant="body2">
                        {file.name}
                      </Typography>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
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
                  label="Средний балл в аттестате"
                  type="text"
                  inputMode="decimal"
                  value={applicationForm.points}
                  onChange={(event) => setApplicationForm({ ...applicationForm, points: event.target.value })}
                  error={Boolean(applicationFormErrors.points)}
                  helperText={applicationFormErrors.points || 'Допустимо значение от 2.00 до 5.00'}
                  inputProps={{ min: AVERAGE_SCORE_MIN, max: AVERAGE_SCORE_MAX, step: '0.01' }}
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
          <Button
            type="submit"
            variant="contained"
            startIcon={<CloudUpload />}
            sx={{ alignSelf: 'flex-start' }}
            disabled={!availableSpecialitiesForCreate.length}
          >
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

function LeaderboardSection({
  publicLeaderboard,
  selectedLeaderboardSpecialityId,
  setSelectedLeaderboardSpecialityId,
}) {
  const selectedLeaderboard = useMemo(
    () => publicLeaderboard.find((item) => `${item.specialityId}` === `${selectedLeaderboardSpecialityId}`) || null,
    [publicLeaderboard, selectedLeaderboardSpecialityId],
  );

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title="Конкурсный список"
            text="Списки отсортированы по среднему баллу в аттестате. Бюджетные места подсвечены зелёной рамкой."
          />

          {publicLeaderboard.length ? (
            <>
              <Tabs
                value={selectedLeaderboardSpecialityId}
                onChange={(_, nextValue) => setSelectedLeaderboardSpecialityId(nextValue)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                {publicLeaderboard.map((item) => (
                  <Tab
                    key={item.specialityId}
                    value={`${item.specialityId}`}
                    label={`${item.specialityCode} · ${item.specialityName}`}
                  />
                ))}
              </Tabs>

              {selectedLeaderboard ? (
                <Stack spacing={2}>
                  <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor: alpha('#fff', 0.9) }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip label={selectedLeaderboard.departmentName} size="small" />
                          <Chip label={selectedLeaderboard.specialityCode} size="small" variant="outlined" />
                          <Chip label={`Бюджетных мест: ${selectedLeaderboard.budgetPlaces || 0}`} size="small" color="success" variant="outlined" />
                          <Chip label={`Заявок: ${selectedLeaderboard.applications || 0}`} size="small" variant="outlined" />
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {selectedLeaderboard.specialityName}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Stack spacing={1.5}>
                    {selectedLeaderboard.entries?.map((entry) => (
                      <Card
                        key={entry.applicationId}
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          borderWidth: 2,
                          borderColor: entry.budgetPlace ? 'success.main' : 'divider',
                          bgcolor: entry.budgetPlace ? alpha('#2e7d32', 0.04) : 'background.paper',
                        }}
                      >
                        <CardContent sx={{ py: 2, px: 2.5 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={2} md={1}>
                              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
                                #{entry.rank}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={10} md={7}>
                              <Stack spacing={0.5}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  {entry.fullName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {entry.username} · {entry.graduationSchool} · {entry.graduationYear}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                              <Stack alignItems={{ xs: 'flex-start', md: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Средний балл
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                  {formatAverageScore(entry.points)}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                              <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                                <Chip
                                  label={entry.budgetPlace ? 'Проходит на бюджет' : 'Коммерция / конкурс'}
                                  color={entry.budgetPlace ? 'success' : 'default'}
                                  variant={entry.budgetPlace ? 'filled' : 'outlined'}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                                  {entry.status}
                                </Typography>
                              </Stack>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <EmptyState title="Нет данных" text="Для выбранной специальности пока нет заявок." />
              )}
            </>
          ) : (
            <EmptyState title="Нет конкурсного списка" text="Сейчас нет данных для построения рейтинга." />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ApplicationChatSection({ auth, applicationId, currentUsername, title, text }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastMessageAt, setLastMessageAt] = useState(null);
  const [chatError, setChatError] = useState('');
  const messagesEndRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!auth || !applicationId) return;
    setLoading(true);
    try {
      const nextMessages = await api.applicationChatMessages(auth.token, applicationId);
      setMessages(nextMessages);
      setLastMessageAt(nextMessages.length ? nextMessages[nextMessages.length - 1].createdAt : null);
      setChatError('');
    } catch (nextError) {
      setChatError(nextError.message);
    } finally {
      setLoading(false);
    }
  }, [auth, applicationId]);

  const checkLastMessage = useCallback(async () => {
    if (!auth || !applicationId) return;
    try {
      const snapshot = await api.applicationChatLastMessage(auth.token, applicationId);
      const nextLast = snapshot.lastMessageAt || null;
      if (`${nextLast || ''}` !== `${lastMessageAt || ''}`) {
        await loadMessages();
      }
    } catch (nextError) {
      setChatError(nextError.message);
    }
  }, [auth, applicationId, lastMessageAt, loadMessages]);

  useEffect(() => {
    setDraft('');
    setChatError('');
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      checkLastMessage();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [checkLastMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function handleSendMessage(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) {
      return;
    }

    setSending(true);
    setChatError('');
    try {
      await api.applicationSendChatMessage(auth.token, applicationId, content);
      setDraft('');
      await loadMessages();
    } catch (nextError) {
      setChatError(nextError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <SectionHeader title={title} text={text} />

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              maxHeight: 420,
              overflowY: 'auto',
              p: 2,
            }}
          >
            {loading && !messages.length ? (
              <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 160 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : messages.length ? (
              <Stack spacing={1.5}>
                {messages.map((message) => {
                  const isOwn = message.sender.username === currentUsername;
                  return (
                    <Box key={message.id} sx={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                      <Card
                        variant="outlined"
                        sx={{
                          maxWidth: '82%',
                          width: 'fit-content',
                          borderRadius: 3,
                          borderColor: isOwn ? 'success.main' : 'divider',
                          bgcolor: isOwn ? alpha('#2e7d32', 0.06) : alpha('#fff', 0.95),
                        }}
                      >
                        <CardContent sx={{ py: 1.5, px: 2 }}>
                          <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {message.sender.fullName}
                              </Typography>
                              <Chip
                                label={ROLE_LABELS[message.sender.role]}
                                size="small"
                                variant="outlined"
                                color={isOwn ? 'success' : 'default'}
                              />
                            </Stack>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                              {message.content}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(message.createdAt)}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Stack>
            ) : (
              <EmptyState title="Чат пуст" text="Напишите первое сообщение по этой заявке." />
            )}
          </Box>

          {chatError ? <Alert severity="error" variant="outlined">{chatError}</Alert> : null}

          <Stack component="form" spacing={2} onSubmit={handleSendMessage}>
            <TextField
              label="Сообщение"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              multiline
              minRows={3}
              fullWidth
              placeholder="Напишите текстовое сообщение..."
            />
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <Typography variant="body2" color="text.secondary">
                Обновление чата происходит автоматически каждые 5 секунд.
              </Typography>
              <Button type="submit" variant="contained" disabled={sending || !draft.trim()}>
                {sending ? 'Отправка...' : 'Отправить'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DepartmentDirectorySection({
  auth,
  departments,
  specialities,
  applicantApplications,
  setApplicationForm,
  setActiveSection,
  setSelectedApplicantApplicationId,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <SectionHeader title="Отделения" text="Каждое отделение объединяет связанные специальности и учебные программы." />
        <Grid container spacing={2}>
          {departments.map((department) => (
            <Grid item xs={12} sm={6} lg={4} key={department.id}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2.5, bgcolor: alpha('#fff', 0.9) }}>
                <CardContent>
                  {(() => {
                    const departmentSpecialities = specialities.filter((item) => item.department?.id === department.id);
                    return (
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip label={department.code} size="small" />
                          <Chip label={`${departmentSpecialities.length} спец.`} size="small" variant="outlined" />
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {department.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {department.description}
                        </Typography>
                        <Divider sx={{ my: 0.5 }} />
                        <Stack spacing={1}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
                            Специальности
                          </Typography>
                          {departmentSpecialities.length ? (
                            <Stack spacing={1}>
                              {departmentSpecialities.map((speciality) => {
                                const applicantApplication = applicantApplications?.find(
                                  (item) => `${item.speciality?.id || ''}` === `${speciality.id}`,
                                );
                                const isApplicant = auth?.user?.role === 'APPLICANT';
                                const alreadyApplied = Boolean(applicantApplication);

                                return (
                                  <Card
                                    key={speciality.id}
                                    variant="outlined"
                                    sx={{
                                      borderRadius: 2,
                                      borderColor: alreadyApplied ? 'success.main' : 'divider',
                                      bgcolor: alreadyApplied ? alpha('#2e7d32', 0.04) : alpha('#fff', 0.7),
                                    }}
                                  >
                                    <CardContent sx={{ py: 1.5, px: 2 }}>
                                      <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                                          <Chip label={speciality.code} size="small" variant="outlined" />
                                          <Chip label={`${speciality.admissionPlan} мест`} size="small" variant="outlined" />
                                          {alreadyApplied ? (
                                            <Chip label="Заявка подана" size="small" color="success" />
                                          ) : (
                                            <Chip label="Свободно" size="small" color="default" variant="outlined" />
                                          )}
                                        </Stack>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                          {speciality.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {speciality.description}
                                        </Typography>
                                        {isApplicant ? (
                                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                            {alreadyApplied ? (
                                              <>
                                                <Button
                                                  size="small"
                                                  variant="outlined"
                                                  color="success"
                                                  onClick={() => {
                                                    setSelectedApplicantApplicationId(`${applicantApplication.id}`);
                                                    setActiveSection('application-details');
                                                  }}
                                                >
                                                  Открыть заявку
                                                </Button>
                                                <Typography variant="caption" color="success.main" sx={{ alignSelf: 'center', fontWeight: 700 }}>
                                                  Уже подана на эту специальность
                                                </Typography>
                                              </>
                                            ) : (
                                              <Button
                                                size="small"
                                                variant="contained"
                                                onClick={() => {
                                                  setApplicationForm((current) => ({
                                                    ...current,
                                                    specialityId: `${speciality.id}`,
                                                  }));
                                                  setActiveSection('application-create');
                                                }}
                                              >
                                                Подать заявку
                                              </Button>
                                            )}
                                          </Stack>
                                        ) : null}
                                      </Stack>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Пока нет специальных программ.
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    );
                  })()}
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
  applications,
  selectedStaffApplication,
  setSelectedStaffApplicationId,
  setActiveSection,
  updateApplicationStatus,
  updatingApplicationId,
  applicationSearchQuery,
  setApplicationSearchQuery,
  applicationSortMode,
  setApplicationSortMode,
}) {
  const [draggedApplicationId, setDraggedApplicationId] = useState('');
  const groupedApplications = useMemo(() => {
    return KANBAN_STATUSES.reduce((acc, status) => {
      acc[status] = applications
        .filter((application) => application.status === status)
        .filter((application) => {
          const query = applicationSearchQuery.trim().toLowerCase();
          if (!query) {
            return true;
          }
          return getApplicationSearchText(application).includes(query);
        });

      acc[status] = sortApplications(acc[status], applicationSortMode);
      return acc;
    }, {});
  }, [applications, applicationSearchQuery, applicationSortMode]);

  const visibleApplicationsCount = useMemo(
    () => Object.values(groupedApplications).reduce((sum, items) => sum + items.length, 0),
    [groupedApplications],
  );

  function handleDragStart(applicationId) {
    if (updatingApplicationId) {
      return;
    }
    setDraggedApplicationId(`${applicationId}`);
  }

  function handleDrop(nextStatus, application) {
    if (!draggedApplicationId || updatingApplicationId) {
      return;
    }
    if (`${application.status}` === `${nextStatus}`) {
      setDraggedApplicationId('');
      return;
    }

    updateApplicationStatus(application.id, nextStatus, application.staffComment || '');
    setDraggedApplicationId('');
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title="Канбан заявок"
            text="Перетаскивайте карточки между колонками статусов. Клик по карточке открывает подробности заявки."
          />

          <ApplicationsFiltersBar
            searchValue={applicationSearchQuery}
            onSearchChange={setApplicationSearchQuery}
            sortValue={applicationSortMode}
            onSortChange={setApplicationSortMode}
            showStatusFilter={false}
            helperText="Поиск работает по ФИО, специальности, отделению, статусу и номеру заявки. Сортировка применяется внутри каждой колонки."
          />

          {visibleApplicationsCount === 0 ? (
            <Box sx={{ p: 2 }}>
              <EmptyState
                title="Ничего не найдено"
                text="Попробуйте изменить поиск или сортировку."
              />
            </Box>
          ) : null}

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 2,
              overflowX: 'auto',
              pb: 1,
              alignItems: 'stretch',
            }}
          >
            {KANBAN_STATUSES.map((status) => (
              <Box
                key={status}
                sx={{
                  minWidth: 320,
                  flex: '0 0 320px',
                }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    height: '100%',
                    bgcolor: alpha('#fff', 0.85),
                    borderColor: 'divider',
                    position: 'relative',
                  }}
                  aria-busy={Boolean(updatingApplicationId)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    const application = applications.find((item) => `${item.id}` === draggedApplicationId);
                    if (application) {
                      handleDrop(status, application);
                    }
                  }}
                >
                  <CardContent sx={{ p: 1.75 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {STATUS_LABELS[status]}
                        </Typography>
                        <Chip label={groupedApplications[status]?.length || 0} size="small" />
                      </Stack>

                      <Stack spacing={1.25}>
                        {groupedApplications[status]?.length ? (
                          groupedApplications[status].map((application) => {
                            const isSelected = selectedStaffApplication?.id === application.id;
                            return (
                              <Card
                                key={application.id}
                                variant="outlined"
                                draggable={!updatingApplicationId}
                                onDragStart={() => handleDragStart(application.id)}
                                onClick={() => {
                                  if (updatingApplicationId) {
                                    return;
                                  }
                                  setSelectedStaffApplicationId(`${application.id}`);
                                  setActiveSection('application-details');
                                }}
                                sx={{
                                  borderRadius: 2,
                                  cursor: updatingApplicationId ? 'wait' : 'pointer',
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  bgcolor: isSelected ? alpha('#1a73e8', 0.08) : 'background.paper',
                                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                  opacity: updatingApplicationId === `${application.id}` ? 0.75 : 1,
                                  '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 6px 18px rgba(60,64,67,0.10)',
                                  },
                                }}
                              >
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Stack spacing={1}>
                                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                                      <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                          №{application.id}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                          {application.applicant.fullName}
                                        </Typography>
                                      </Box>
                                      {updatingApplicationId === `${application.id}` ? (
                                        <CircularProgress size={22} />
                                      ) : (
                                        <StatusChip status={application.status} />
                                      )}
                                    </Stack>
                                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
                                      {application.speciality.code}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                                      {application.speciality.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Средний балл: {formatAverageScore(application.points)}
                                    </Typography>
                                  </Stack>
                                </CardContent>
                              </Card>
                            );
                          })
                        ) : (
                          <Box
                            sx={{
                              border: '1px dashed',
                              borderColor: 'divider',
                              borderRadius: 2,
                              p: 2,
                              minHeight: 120,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'text.secondary',
                              textAlign: 'center',
                            }}
                          >
                            Нет заявок
                          </Box>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Stack>
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
  selectDepartmentForEditing,
  startNewDepartment,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title="Отделения"
            text="Откройте любое отделение, чтобы редактировать его на отдельной странице."
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="contained" startIcon={<Add />} onClick={startNewDepartment}>
              Новое отделение
            </Button>
          </Stack>

          <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {adminDepartments.map((department) => (
              <ListItemButton
                key={department.id}
                onClick={() => selectDepartmentForEditing(department)}
                sx={{ alignItems: 'flex-start', py: 1.5 }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {department.code}
                      </Typography>
                      <Chip size="small" variant="outlined" label="Открыть" />
                    </Stack>
                  }
                  secondary={department.name}
                />
              </ListItemButton>
            ))}
            {!adminDepartments.length ? (
              <Box sx={{ p: 2 }}>
                <EmptyState title="Отделений пока нет" text="Создайте первое отделение, чтобы привязать к нему специальности." />
              </Box>
            ) : null}
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminDepartmentFormSection({
  departmentForm,
  setDepartmentForm,
  departmentErrors,
  selectedDepartment,
  setActiveSection,
  handleDepartmentSave,
  handleDeleteDepartment,
  departmentActionLabel,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title={selectedDepartment ? 'Редактирование отделения' : 'Новое отделение'}
            text="Заполните данные отделения и сохраните изменения."
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" onClick={() => setActiveSection('departments')}>
              Назад к отделениям
            </Button>
          </Stack>

          <Stack component="form" spacing={2} onSubmit={handleDepartmentSave}>
            <TextField
              label="Код"
              value={departmentForm.code}
              onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value })}
              error={Boolean(departmentErrors.code)}
              helperText={departmentErrors.code}
              fullWidth
            />
            <TextField
              label="Название"
              value={departmentForm.name}
              onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })}
              error={Boolean(departmentErrors.name)}
              helperText={departmentErrors.name}
              fullWidth
            />
            <TextField
              label="Описание"
              value={departmentForm.description}
              onChange={(event) => setDepartmentForm({ ...departmentForm, description: event.target.value })}
              multiline
              minRows={4}
              fullWidth
            />

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
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminSpecialitiesSection({
  adminDepartments,
  adminSpecialities,
  selectedAdminSpeciality,
  selectSpecialityForEditing,
  startNewSpeciality,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title="Специальности"
            text="Откройте специальность, чтобы редактировать её на отдельной странице."
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="contained" startIcon={<Add />} onClick={startNewSpeciality}>
              Новая специальность
            </Button>
          </Stack>

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
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {speciality.code}
                      </Typography>
                      <Chip size="small" variant="outlined" label="Открыть" />
                    </Stack>
                  }
                  secondary={`${speciality.department?.name || 'Без отделения'} · ${speciality.name}`}
                />
              </ListItemButton>
            ))}
            {!adminSpecialities.length ? (
              <Box sx={{ p: 2 }}>
                <EmptyState title="Специальностей пока нет" text="Создайте первую специальность и привяжите её к отделению." />
              </Box>
            ) : null}
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminSpecialityFormSection({
  adminDepartments,
  specialityForm,
  setSpecialityForm,
  specialityErrors,
  selectedAdminSpeciality,
  setActiveSection,
  handleSpecialitySave,
  handleDeleteSpeciality,
  primaryActionLabel,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title={selectedAdminSpeciality ? 'Редактирование специальности' : 'Новая специальность'}
            text="Заполните данные специальности и сохраните изменения."
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" onClick={() => setActiveSection('specialities')}>
              Назад к специальностям
            </Button>
          </Stack>

          <Stack component="form" spacing={2} onSubmit={handleSpecialitySave}>
            <TextField
              select
              label="Отделение"
              value={specialityForm.departmentId}
              onChange={(event) => setSpecialityForm({ ...specialityForm, departmentId: event.target.value })}
              error={Boolean(specialityErrors.departmentId)}
              helperText={specialityErrors.departmentId}
              fullWidth
            >
              <MenuItem value="">Выберите отделение</MenuItem>
              {adminDepartments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.code} · {department.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Код"
              value={specialityForm.code}
              onChange={(event) => setSpecialityForm({ ...specialityForm, code: event.target.value })}
              error={Boolean(specialityErrors.code)}
              helperText={specialityErrors.code}
              fullWidth
            />
            <TextField
              label="Название"
              value={specialityForm.name}
              onChange={(event) => setSpecialityForm({ ...specialityForm, name: event.target.value })}
              error={Boolean(specialityErrors.name)}
              helperText={specialityErrors.name}
              fullWidth
            />
            <TextField
              label="Бюджетные места"
              type="number"
              value={specialityForm.budgetPlaces}
              onChange={(event) => setSpecialityForm({ ...specialityForm, budgetPlaces: event.target.value })}
              error={Boolean(specialityErrors.budgetPlaces)}
              helperText={specialityErrors.budgetPlaces}
              fullWidth
            />
            <TextField
              label="Платные места"
              type="number"
              value={specialityForm.paidPlaces}
              onChange={(event) => setSpecialityForm({ ...specialityForm, paidPlaces: event.target.value })}
              error={Boolean(specialityErrors.paidPlaces)}
              helperText={specialityErrors.paidPlaces}
              fullWidth
            />
            <TextField
              label="Описание"
              value={specialityForm.description}
              onChange={(event) => setSpecialityForm({ ...specialityForm, description: event.target.value })}
              multiline
              minRows={4}
              fullWidth
            />

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
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminUsersSection({
  adminUsers,
  selectUserForEditing,
  startNewUser,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title="Пользователи"
            text="Откройте пользователя, чтобы редактировать его на отдельной странице."
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="contained" startIcon={<Add />} onClick={startNewUser}>
              Новый пользователь
            </Button>
          </Stack>

          <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {adminUsers.map((user) => (
              <ListItemButton
                key={user.id}
                onClick={() => selectUserForEditing(user)}
                sx={{ alignItems: 'flex-start', py: 1.5 }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {user.fullName}
                      </Typography>
                      <Chip size="small" variant="outlined" label={ROLE_LABELS[user.role]} />
                    </Stack>
                  }
                  secondary={`${user.username} · ${user.email || 'без email'}`}
                />
              </ListItemButton>
            ))}
            {!adminUsers.length ? (
              <Box sx={{ p: 2 }}>
                <EmptyState title="Пользователей пока нет" text="Создайте первого сотрудника или администратора." />
              </Box>
            ) : null}
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminUserFormSection({
  userForm,
  setUserForm,
  userErrors,
  selectedAdminUser,
  setActiveSection,
  handleUserSave,
  userActionLabel,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <SectionHeader
            title={selectedAdminUser ? 'Редактирование пользователя' : 'Новый пользователь'}
            text="Создайте сотрудника или администратора на отдельной странице."
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" onClick={() => setActiveSection('users')}>
              Назад к пользователям
            </Button>
          </Stack>

          <Stack component="form" spacing={2} onSubmit={handleUserSave}>
            <TextField
              label="ФИО"
              value={userForm.fullName}
              onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })}
              error={Boolean(userErrors.fullName)}
              helperText={userErrors.fullName}
              fullWidth
            />
            <TextField
              label="Логин"
              value={userForm.username}
              onChange={(event) => setUserForm({ ...userForm, username: event.target.value })}
              error={Boolean(userErrors.username)}
              helperText={userErrors.username}
              fullWidth
              InputProps={{ readOnly: Boolean(selectedAdminUser) }}
            />
            <TextField
              label="Пароль"
              type="password"
              value={userForm.password}
              onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
              placeholder={selectedAdminUser ? 'Оставьте пустым, если не меняете' : ''}
              error={Boolean(userErrors.password)}
              helperText={userErrors.password || (selectedAdminUser ? 'Минимум 6 символов, если меняете пароль' : 'Минимум 6 символов')}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
              error={Boolean(userErrors.email)}
              helperText={userErrors.email}
              fullWidth
            />
            <TextField
              label="Телефон"
              value={userForm.phone}
              onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })}
              error={Boolean(userErrors.phone)}
              helperText={userErrors.phone}
              fullWidth
            />
            <TextField
              select
              label="Роль"
              value={userForm.role}
              onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
              error={Boolean(userErrors.role)}
              helperText={userErrors.role}
              fullWidth
            >
              <MenuItem value="STAFF">Сотрудник</MenuItem>
              <MenuItem value="ADMIN">Администратор</MenuItem>
              <MenuItem value="APPLICANT">Абитуриент</MenuItem>
            </TextField>
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

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button type="submit" variant="contained">
                {userActionLabel}
              </Button>
            </Stack>
          </Stack>
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

function ApplicationsFiltersBar({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  showStatusFilter,
  statusValue = 'ALL',
  onStatusChange,
  statusFilterLabel = 'Статус',
  helperText,
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor: alpha('#fff', 0.82) }}>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={showStatusFilter ? 5 : 6}>
              <TextField
                label="Поиск"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="ФИО, специальность, отделение, № заявки"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={showStatusFilter ? 3 : 6}>
              <TextField
                select
                label="Сортировка"
                value={sortValue}
                onChange={(event) => onSortChange(event.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Sort fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              >
                {APPLICATION_SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {showStatusFilter ? (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label={statusFilterLabel}
                  value={statusValue}
                  onChange={(event) => onStatusChange(event.target.value)}
                  fullWidth
                >
                  {APPLICATION_STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : null}
          </Grid>

          {helperText ? (
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }) {
  const chipStyles = {
    SUBMITTED: { label: STATUS_LABELS.SUBMITTED, bg: alpha('#1a73e8', 0.10), color: '#174ea6' },
    UNDER_REVIEW: { label: STATUS_LABELS.UNDER_REVIEW, bg: alpha('#f9ab00', 0.15), color: '#8a4f00' },
    MISSING_DOCS: { label: STATUS_LABELS.MISSING_DOCS, bg: alpha('#ea4335', 0.10), color: '#b3261e' },
    ACCEPTED: { label: STATUS_LABELS.ACCEPTED, bg: alpha('#34a853', 0.12), color: '#137333' },
    REJECTED: { label: STATUS_LABELS.REJECTED, bg: alpha('#ea4335', 0.10), color: '#b3261e' },
    CANCELLED: { label: STATUS_LABELS.CANCELLED, bg: alpha('#5f6368', 0.12), color: '#3c4043' },
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
              {DOCUMENT_TYPE_LABELS[document.type] || document.type} · {formatBytes(document.size)}
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
