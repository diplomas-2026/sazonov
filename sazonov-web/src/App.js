import { useEffect, useMemo, useState } from 'react';
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

const emptySpeciality = {
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
  const [specialityForm, setSpecialityForm] = useState(emptySpeciality);
  const [userForm, setUserForm] = useState(emptyUser);

  const [publicSpecialities, setPublicSpecialities] = useState([]);
  const [publicDashboard, setPublicDashboard] = useState(null);
  const [applicantApplications, setApplicantApplications] = useState([]);
  const [staffApplications, setStaffApplications] = useState([]);
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSpecialities, setAdminSpecialities] = useState([]);
  const [adminDashboard, setAdminDashboard] = useState(null);

  const [selectedApplicantApplicationId, setSelectedApplicantApplicationId] = useState('');
  const [selectedStaffApplicationId, setSelectedStaffApplicationId] = useState('');
  const [selectedSpecialityId, setSelectedSpecialityId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [creatingSpeciality, setCreatingSpeciality] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    const stored = loadStoredAuth();
    loadPublic();

    if (!stored?.token) {
      setBooting(false);
      return;
    }

    (async () => {
      try {
        const me = await api.me(stored.token);
        const nextAuth = { token: me.token || stored.token, user: me.user };
        setAuth(nextAuth);
        saveStoredAuth(nextAuth);
        setProfileForm({
          fullName: me.user.fullName,
          email: me.user.email,
          phone: me.user.phone,
        });
        await loadWorkspace(nextAuth);
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

  async function loadPublic() {
    try {
      const [specialities, dashboard] = await Promise.all([api.publicSpecialities(), api.publicDashboard()]);
      setPublicSpecialities(specialities);
      setPublicDashboard(dashboard);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function loadWorkspace(nextAuth = auth) {
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
        const [dashboard, specialities, users] = await Promise.all([
          api.adminDashboard(nextAuth.token),
          api.adminSpecialities(nextAuth.token),
          api.adminUsers(nextAuth.token),
        ]);
        setAdminDashboard(dashboard);
        setAdminSpecialities(specialities);
        setAdminUsers(users);
        setSelectedSpecialityId((current) => current || `${specialities[0]?.id || ''}`);
        setSelectedUserId((current) => current || `${users[0]?.id || ''}`);
      }
    } catch (nextError) {
      setError(nextError.message);
    }
  }

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
    setAdminSpecialities([]);
    setAdminDashboard(null);
    setSelectedApplicantApplicationId('');
    setSelectedStaffApplicationId('');
    setSelectedSpecialityId('');
    setSelectedUserId('');
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
        budgetPlaces: Number(specialityForm.budgetPlaces),
        paidPlaces: Number(specialityForm.paidPlaces),
        admissionPlan: Number(specialityForm.admissionPlan),
      };
      let saved;
      if (selectedAdminSpeciality) {
        saved = await api.adminUpdateSpeciality(auth.token, selectedAdminSpeciality.id, payload);
        setMessage('Направление обновлено');
      } else {
        saved = await api.adminCreateSpeciality(auth.token, payload);
        setMessage('Направление создано');
      }
      setCreatingSpeciality(false);
      const specialities = await api.adminSpecialities(auth.token);
      setAdminSpecialities(specialities);
      if (saved) {
        setSelectedSpecialityId(`${saved.id}`);
        setSpecialityForm({
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
      setMessage('Направление удалено');
      const specialities = await api.adminSpecialities(auth.token);
      setAdminSpecialities(specialities);
      if (specialities.length > 0) {
        const first = specialities[0];
        setCreatingSpeciality(false);
        setSelectedSpecialityId(`${first.id}`);
        setSpecialityForm({
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
    setSpecialityForm(emptySpeciality);
  }

  function startNewUser() {
    setCreatingUser(true);
    setSelectedUserId('');
    setUserForm(emptyUser);
  }

  const primaryActionLabel = selectedAdminSpeciality && !creatingSpeciality ? 'Сохранить направление' : 'Создать направление';
  const userActionLabel = selectedAdminUser && !creatingUser ? 'Сохранить пользователя' : 'Создать пользователя';

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="page">
        <header className="hero">
          <div className="brand">
            <span className="brand-mark">ПК</span>
            <div>
              <p className="eyebrow">ГБПОУ ПГК</p>
              <h1>Система учета приемной комиссии</h1>
            </div>
          </div>
          <p className="hero-text">
            Единая платформа для абитуриентов, сотрудников и администраторов: заявки, документы, статусы и аналитика
            в одном месте.
          </p>
          <div className="hero-actions">
            {auth ? (
              <>
                <button className="ghost-button" onClick={handleWorkspaceRefresh}>Обновить данные</button>
                <button className="ghost-button" onClick={handleLogout}>Выйти</button>
              </>
            ) : (
              <>
                <button className={`ghost-button ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
                  Вход
                </button>
                <button className={`ghost-button ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
                  Регистрация
                </button>
              </>
            )}
          </div>
        </header>

        {message ? <div className="toast success">{message}</div> : null}
        {error ? <div className="toast error">{error}</div> : null}

        {booting ? (
          <section className="panel loading-panel">
            <div className="spinner" />
            <p>Подключаемся к API и загружаем данные...</p>
          </section>
        ) : !auth ? (
          <section className="auth-grid">
            <div className="panel intro-panel">
              <p className="eyebrow">Что умеет система</p>
              <div className="feature-list">
                <Feature title="Абитуриент" text="Заполняет заявку, загружает документы и видит статус обработки." />
                <Feature title="Сотрудник" text="Проверяет пакет документов, меняет статусы и ведет очередь заявок." />
                <Feature title="Администратор" text="Управляет пользователями, направлениями и смотрит сводную аналитику." />
              </div>
              <div className="stats-grid">
                <StatCard label="Направлений" value={publicSpecialities.length} />
                <StatCard label="Заявок всего" value={publicDashboard?.totalApplications || 0} />
                <StatCard label="На проверке" value={publicDashboard?.underReview || 0} />
              </div>
            </div>

            <div className="panel auth-panel">
              <div className="tab-row">
                <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => setMode('login')}>
                  Вход
                </button>
                <button className={mode === 'register' ? 'tab active' : 'tab'} onClick={() => setMode('register')}>
                  Регистрация абитуриента
                </button>
              </div>

              {mode === 'login' ? (
                <form className="form-stack" onSubmit={handleLogin}>
                  <Field label="Логин">
                    <input
                      value={loginForm.username}
                      onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                      placeholder="admin"
                    />
                  </Field>
                  <Field label="Пароль">
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                      placeholder="admin123"
                    />
                  </Field>
                  <button className="primary-button" type="submit">Войти</button>
                  <p className="hint">
                    Демо-доступ: <code>admin / admin123</code> или <code>staff / staff123</code>
                  </p>
                </form>
              ) : (
                <form className="form-stack" onSubmit={handleRegister}>
                  <Field label="ФИО">
                    <input
                      value={registerForm.fullName}
                      onChange={(event) => setRegisterForm({ ...registerForm, fullName: event.target.value })}
                      placeholder="Иванов Иван Иванович"
                    />
                  </Field>
                  <Field label="Логин">
                    <input
                      value={registerForm.username}
                      onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                      placeholder="ivanov"
                    />
                  </Field>
                  <Field label="Пароль">
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                      placeholder="Не меньше 6 символов"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                      placeholder="student@example.com"
                    />
                  </Field>
                  <Field label="Телефон">
                    <input
                      value={registerForm.phone}
                      onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })}
                      placeholder="+7 (900) 000-00-00"
                    />
                  </Field>
                  <button className="primary-button" type="submit">Создать аккаунт</button>
                </form>
              )}
            </div>
          </section>
        ) : (
          <section className="workspace">
            <div className="panel workspace-head">
              <div>
                <p className="eyebrow">В системе</p>
                <h2>{auth.user.fullName}</h2>
                <p className="subtle">
                  {ROLE_LABELS[auth.user.role]} · {auth.user.username}
                </p>
              </div>
              <div className="stats-grid compact">
                <StatCard label="Моя роль" value={ROLE_LABELS[auth.user.role]} />
                <StatCard label="Направлений" value={publicSpecialities.length} />
                <StatCard label="Заявок" value={publicDashboard?.totalApplications || 0} />
              </div>
            </div>

            <div className="stats-grid">
              <StatCard label="Одобрено" value={publicDashboard?.accepted || 0} tone="good" />
              <StatCard label="Отклонено" value={publicDashboard?.rejected || 0} tone="danger" />
              <StatCard label="Нужны документы" value={publicDashboard?.missingDocs || 0} tone="warn" />
            </div>

            {auth.user.role === 'APPLICANT' ? (
              <ApplicantWorkspace
                auth={auth}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                handleSaveProfile={handleSaveProfile}
                applicationForm={applicationForm}
                setApplicationForm={setApplicationForm}
                publicSpecialities={publicSpecialities}
                applicantApplications={applicantApplications}
                selectedApplicantApplication={selectedApplicantApplication}
                setSelectedApplicantApplicationId={setSelectedApplicantApplicationId}
                handleCreateApplication={handleCreateApplication}
                handleUploadDocument={handleUploadDocument}
                handleDeleteDocument={handleDeleteDocument}
                handleDownloadDocument={handleDownloadDocument}
                documentTypes={DOCUMENT_TYPES}
              />
            ) : null}

            {auth.user.role === 'STAFF' || auth.user.role === 'ADMIN' ? (
              <StaffWorkspace
                auth={auth}
                staffFilter={staffFilter}
                setStaffFilter={handleStaffFilterChange}
                applications={staffApplications}
                selectedStaffApplication={selectedStaffApplication}
                setSelectedStaffApplicationId={setSelectedStaffApplicationId}
                handleStaffStatusSave={handleStaffStatusSave}
                statusOptions={STATUS_OPTIONS}
              />
            ) : null}

            {auth.user.role === 'ADMIN' ? (
              <AdminWorkspace
                auth={auth}
                adminDashboard={adminDashboard}
                adminSpecialities={adminSpecialities}
                adminUsers={adminUsers}
                specialityForm={specialityForm}
                setSpecialityForm={setSpecialityForm}
                selectedAdminSpeciality={selectedAdminSpeciality}
                selectSpecialityForEditing={selectSpecialityForEditing}
                startNewSpeciality={startNewSpeciality}
                handleSpecialitySave={handleSpecialitySave}
                handleDeleteSpeciality={handleDeleteSpeciality}
                primaryActionLabel={primaryActionLabel}
                userForm={userForm}
                setUserForm={setUserForm}
                selectedAdminUser={selectedAdminUser}
                selectUserForEditing={selectUserForEditing}
                startNewUser={startNewUser}
                handleUserSave={handleUserSave}
                userActionLabel={userActionLabel}
              />
            ) : null}

            {auth.user.role === 'APPLICANT' ? (
              <section className="panel">
                <SectionTitle title="Мои документы" text="Все загруженные файлы прикреплены к выбранной заявке." />
                {selectedApplicantApplication ? (
                  <div className="docs-grid">
                    {selectedApplicantApplication.documents?.length ? selectedApplicantApplication.documents.map((document) => (
                      <article className="doc-card" key={document.id}>
                        <div>
                          <p className="doc-title">{document.fileName}</p>
                          <p className="subtle">{document.type} · {formatBytes(document.size)}</p>
                        </div>
                        <div className="row-actions">
                          <button className="ghost-button" onClick={() => handleDownloadDocument(document.id)}>Скачать</button>
                          <button className="ghost-button danger" onClick={() => handleDeleteDocument(document.id)}>Удалить</button>
                        </div>
                      </article>
                    )) : (
                      <EmptyState title="Пока нет документов" text="Выберите заявку и загрузите паспорт, аттестат или другие файлы." />
                    )}
                  </div>
                ) : (
                  <EmptyState title="Нет выбранной заявки" text="Сначала создайте заявку, чтобы прикреплять документы." />
                )}
              </section>
            ) : null}

            <section className="panel">
              <SectionTitle title="Справочник направлений" text="Данные используются и в заявках, и в отчетах." />
              <div className="cards-grid">
                {publicSpecialities.map((speciality) => (
                  <article className="info-card" key={speciality.id}>
                    <div className="pill-row">
                      <span className="pill">{speciality.code}</span>
                      <span className="pill soft">{speciality.admissionPlan} мест</span>
                    </div>
                    <h3>{speciality.name}</h3>
                    <p>{speciality.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

function ApplicantWorkspace({
  auth,
  profileForm,
  setProfileForm,
  handleSaveProfile,
  applicationForm,
  setApplicationForm,
  publicSpecialities,
  applicantApplications,
  selectedApplicantApplication,
  setSelectedApplicantApplicationId,
  handleCreateApplication,
  handleUploadDocument,
  handleDeleteDocument,
  handleDownloadDocument,
  documentTypes,
}) {
  return (
    <div className="workspace-stack">
      <section className="panel">
        <SectionTitle title="Профиль абитуриента" text="Данные профиля подставляются в заявки и используются для связи." />
        <form className="form-grid" onSubmit={handleSaveProfile}>
          <Field label="ФИО">
            <input value={profileForm.fullName} onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} />
          </Field>
          <Field label="Телефон">
            <input value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
          </Field>
          <div className="full-row">
            <button className="primary-button" type="submit">Сохранить профиль</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <SectionTitle title="Новая заявка" text="Выберите направление и заполните данные документа." />
        <form className="form-grid" onSubmit={handleCreateApplication}>
          <Field label="Направление">
            <select
              value={applicationForm.specialityId}
              onChange={(event) => setApplicationForm({ ...applicationForm, specialityId: event.target.value })}
            >
              <option value="">Выберите направление</option>
              {publicSpecialities.map((speciality) => (
                <option key={speciality.id} value={speciality.id}>
                  {speciality.code} · {speciality.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Серия паспорта">
            <input value={applicationForm.passportSeries} onChange={(event) => setApplicationForm({ ...applicationForm, passportSeries: event.target.value })} />
          </Field>
          <Field label="Номер паспорта">
            <input value={applicationForm.passportNumber} onChange={(event) => setApplicationForm({ ...applicationForm, passportNumber: event.target.value })} />
          </Field>
          <Field label="СНИЛС">
            <input value={applicationForm.snils} onChange={(event) => setApplicationForm({ ...applicationForm, snils: event.target.value })} />
          </Field>
          <Field label="Номер аттестата">
            <input value={applicationForm.educationDocumentNumber} onChange={(event) => setApplicationForm({ ...applicationForm, educationDocumentNumber: event.target.value })} />
          </Field>
          <Field label="Школа / колледж">
            <input value={applicationForm.graduationSchool} onChange={(event) => setApplicationForm({ ...applicationForm, graduationSchool: event.target.value })} />
          </Field>
          <Field label="Год окончания">
            <input type="number" value={applicationForm.graduationYear} onChange={(event) => setApplicationForm({ ...applicationForm, graduationYear: event.target.value })} />
          </Field>
          <Field label="Баллы">
            <input type="number" value={applicationForm.points} onChange={(event) => setApplicationForm({ ...applicationForm, points: event.target.value })} />
          </Field>
          <Field label="Комментарий">
            <textarea rows="3" value={applicationForm.applicantComment} onChange={(event) => setApplicationForm({ ...applicationForm, applicantComment: event.target.value })} />
          </Field>
          <div className="full-row">
            <button className="primary-button" type="submit">Отправить заявку</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <SectionTitle title="Мои заявки" text="Статус обновляется после проверки документов сотрудниками." />
        <div className="split-layout">
          <div className="list-column">
            {applicantApplications.map((application) => (
              <button
                key={application.id}
                className={`list-item ${selectedApplicantApplication?.id === application.id ? 'selected' : ''}`}
                onClick={() => setSelectedApplicantApplicationId(`${application.id}`)}
              >
                <div className="list-main">
                  <strong>{application.speciality.code}</strong>
                  <span>{application.speciality.name}</span>
                </div>
                <span className={`status-pill ${application.status.toLowerCase()}`}>{STATUS_LABELS[application.status]}</span>
              </button>
            ))}
            {!applicantApplications.length ? (
              <EmptyState title="Заявок пока нет" text="Создайте первую заявку, чтобы начать работу с приемной комиссией." />
            ) : null}
          </div>

          <div className="detail-column">
            {selectedApplicantApplication ? (
              <>
                <div className="detail-head">
                  <div>
                    <p className="eyebrow">Заявка №{selectedApplicantApplication.id}</p>
                    <h3>{selectedApplicantApplication.speciality.name}</h3>
                  </div>
                  <span className={`status-pill ${selectedApplicantApplication.status.toLowerCase()}`}>
                    {STATUS_LABELS[selectedApplicantApplication.status]}
                  </span>
                </div>

                <div className="kv-grid">
                  <KeyValue label="Паспорт" value={`${selectedApplicantApplication.passportSeries} ${selectedApplicantApplication.passportNumber}`} />
                  <KeyValue label="СНИЛС" value={selectedApplicantApplication.snils} />
                  <KeyValue label="Аттестат" value={selectedApplicantApplication.educationDocumentNumber} />
                  <KeyValue label="Школа" value={selectedApplicantApplication.graduationSchool} />
                  <KeyValue label="Баллы" value={selectedApplicantApplication.points} />
                  <KeyValue label="Комментарий сотрудника" value={selectedApplicantApplication.staffComment || 'Пока нет замечаний'} />
                </div>

                <form className="upload-card" onSubmit={handleUploadDocument}>
                  <p className="upload-title">Загрузка документа</p>
                  <div className="form-grid">
                    <Field label="Тип документа">
                      <select name="type" defaultValue={documentTypes[0].value}>
                        {documentTypes.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Файл">
                      <input name="file" type="file" />
                    </Field>
                  </div>
                  <button className="primary-button" type="submit">Загрузить</button>
                </form>

                <div className="mini-docs">
                  {selectedApplicantApplication.documents?.map((document) => (
                    <article className="mini-doc" key={document.id}>
                      <div>
                        <strong>{document.fileName}</strong>
                        <p className="subtle">{document.type} · {formatBytes(document.size)}</p>
                      </div>
                      <div className="row-actions">
                        <button className="ghost-button" onClick={() => handleDownloadDocument(document.id)}>Скачать</button>
                        <button className="ghost-button danger" onClick={() => handleDeleteDocument(document.id)}>Удалить</button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="Выберите заявку" text="Слева откройте заявку, чтобы посмотреть детали и прикрепить документы." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StaffWorkspace({
  auth,
  staffFilter,
  setStaffFilter,
  applications,
  selectedStaffApplication,
  setSelectedStaffApplicationId,
  handleStaffStatusSave,
  statusOptions,
}) {
  return (
    <section className="panel">
      <SectionTitle title="Очередь заявок" text="Сотрудник видит все обращения и меняет статусы после проверки пакета документов." />
      <div className="toolbar">
        <div className="tab-row">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={staffFilter === option.value ? 'tab active' : 'tab'}
              onClick={() => setStaffFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="split-layout">
        <div className="list-column tall">
          {applications.map((application) => (
            <button
              key={application.id}
              className={`list-item ${selectedStaffApplication?.id === application.id ? 'selected' : ''}`}
              onClick={() => setSelectedStaffApplicationId(`${application.id}`)}
            >
              <div className="list-main">
                <strong>№{application.id}</strong>
                <span>{application.applicant.fullName}</span>
              </div>
              <span className={`status-pill ${application.status.toLowerCase()}`}>{STATUS_LABELS[application.status]}</span>
            </button>
          ))}
          {!applications.length ? <EmptyState title="Нет заявок" text="Сейчас в очереди нет заявок по выбранному фильтру." /> : null}
        </div>

        <div className="detail-column">
          {selectedStaffApplication ? (
            <>
              <div className="detail-head">
                <div>
                  <p className="eyebrow">Заявка №{selectedStaffApplication.id}</p>
                  <h3>{selectedStaffApplication.applicant.fullName}</h3>
                </div>
                <span className={`status-pill ${selectedStaffApplication.status.toLowerCase()}`}>
                  {STATUS_LABELS[selectedStaffApplication.status]}
                </span>
              </div>

              <div className="kv-grid">
                <KeyValue label="Направление" value={`${selectedStaffApplication.speciality.code} · ${selectedStaffApplication.speciality.name}`} />
                <KeyValue label="Почта" value={selectedStaffApplication.applicant.email} />
                <KeyValue label="Телефон" value={selectedStaffApplication.applicant.phone} />
                <KeyValue label="Дата подачи" value={formatDate(selectedStaffApplication.createdAt)} />
                <KeyValue label="Документов" value={selectedStaffApplication.documents?.length || 0} />
                <KeyValue label="Баллы" value={selectedStaffApplication.points} />
              </div>

              <form key={selectedStaffApplication.id} className="form-stack" onSubmit={handleStaffStatusSave}>
                <Field label="Новый статус">
                  <select name="status" defaultValue={selectedStaffApplication.status}>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Комментарий">
                  <textarea name="staffComment" rows="3" defaultValue={selectedStaffApplication.staffComment || ''} />
                </Field>
                <button className="primary-button" type="submit">Сохранить статус</button>
              </form>

              <div className="mini-docs">
                {selectedStaffApplication.documents?.map((document) => (
                  <article className="mini-doc" key={document.id}>
                    <div>
                      <strong>{document.fileName}</strong>
                      <p className="subtle">{document.type} · {formatBytes(document.size)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="Выберите заявку" text="Откройте заявку слева, чтобы проверить документы и поменять статус." />
          )}
        </div>
      </div>
    </section>
  );
}

function AdminWorkspace({
  auth,
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
  userForm,
  setUserForm,
  selectedAdminUser,
  selectUserForEditing,
  startNewUser,
  handleUserSave,
  userActionLabel,
}) {
  return (
    <div className="workspace-stack">
      <section className="panel">
        <SectionTitle title="Админ-панель" text="Управление направлениями, пользователями и общей статистикой приемной комиссии." />
        <div className="stats-grid">
          <StatCard label="Пользователей" value={adminDashboard?.totalUsers || 0} />
          <StatCard label="Абитуриентов" value={adminDashboard?.totalApplicants || 0} />
          <StatCard label="Заявок" value={adminDashboard?.totalApplications || 0} />
        </div>
      </section>

      <section className="panel">
        <SectionTitle title="Направления" text="Создавайте и редактируйте учебные программы для приемной кампании." />
        <div className="toolbar">
          <button className="ghost-button" type="button" onClick={startNewSpeciality}>Новое направление</button>
        </div>
        <div className="split-layout">
          <div className="list-column">
            {adminSpecialities.map((speciality) => (
              <button
                key={speciality.id}
                className={`list-item ${selectedAdminSpeciality?.id === speciality.id ? 'selected' : ''}`}
                onClick={() => selectSpecialityForEditing(speciality)}
              >
                <div className="list-main">
                  <strong>{speciality.code}</strong>
                  <span>{speciality.name}</span>
                </div>
                <span className="status-pill neutral">{speciality.admissionPlan} мест</span>
              </button>
            ))}
          </div>

          <form className="detail-column form-stack" onSubmit={handleSpecialitySave}>
            <div className="form-grid">
              <Field label="Код">
                <input value={specialityForm.code} onChange={(event) => setSpecialityForm({ ...specialityForm, code: event.target.value })} />
              </Field>
              <Field label="Название">
                <input value={specialityForm.name} onChange={(event) => setSpecialityForm({ ...specialityForm, name: event.target.value })} />
              </Field>
              <Field label="Бюджетные места">
                <input type="number" value={specialityForm.budgetPlaces} onChange={(event) => setSpecialityForm({ ...specialityForm, budgetPlaces: event.target.value })} />
              </Field>
              <Field label="Платные места">
                <input type="number" value={specialityForm.paidPlaces} onChange={(event) => setSpecialityForm({ ...specialityForm, paidPlaces: event.target.value })} />
              </Field>
              <Field label="План приема">
                <input type="number" value={specialityForm.admissionPlan} onChange={(event) => setSpecialityForm({ ...specialityForm, admissionPlan: event.target.value })} />
              </Field>
              <Field label="Описание">
                <textarea rows="4" value={specialityForm.description} onChange={(event) => setSpecialityForm({ ...specialityForm, description: event.target.value })} />
              </Field>
            </div>
            <button className="primary-button" type="submit">{primaryActionLabel}</button>
            {selectedAdminSpeciality ? (
              <button className="ghost-button danger" type="button" onClick={handleDeleteSpeciality}>Удалить направление</button>
            ) : null}
          </form>
        </div>
      </section>

      <section className="panel">
        <SectionTitle title="Пользователи" text="Создавайте сотрудников, администраторов и корректируйте доступы." />
        <div className="toolbar">
          <button className="ghost-button" type="button" onClick={startNewUser}>Новый пользователь</button>
        </div>
        <div className="split-layout">
          <div className="list-column">
            {adminUsers.map((user) => (
              <button
                key={user.id}
                className={`list-item ${selectedAdminUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => selectUserForEditing(user)}
              >
                <div className="list-main">
                  <strong>{user.fullName}</strong>
                  <span>{user.username} · {ROLE_LABELS[user.role]}</span>
                </div>
                <span className={`status-pill ${user.active ? 'good' : 'danger'}`}>{user.active ? 'Активен' : 'Отключен'}</span>
              </button>
            ))}
          </div>

          <form className="detail-column form-stack" onSubmit={handleUserSave}>
            <div className="form-grid">
              <Field label="ФИО">
                <input value={userForm.fullName} onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })} />
              </Field>
              <Field label="Логин">
                <input
                  value={userForm.username}
                  onChange={(event) => setUserForm({ ...userForm, username: event.target.value })}
                  readOnly={Boolean(selectedAdminUser)}
                />
              </Field>
              <Field label="Пароль">
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                  placeholder={selectedAdminUser ? 'Оставьте пустым, если не меняете' : ''}
                />
              </Field>
              <Field label="Email">
                <input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} />
              </Field>
              <Field label="Телефон">
                <input value={userForm.phone} onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })} />
              </Field>
              <Field label="Роль">
                <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                  <option value="STAFF">Сотрудник</option>
                  <option value="ADMIN">Администратор</option>
                  <option value="APPLICANT">Абитуриент</option>
                </select>
              </Field>
              <Field label="Активность">
                <select value={userForm.active ? 'true' : 'false'} onChange={(event) => setUserForm({ ...userForm, active: event.target.value === 'true' })}>
                  <option value="true">Активен</option>
                  <option value="false">Отключен</option>
                </select>
              </Field>
            </div>
            <button className="primary-button" type="submit">{userActionLabel}</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, text }) {
  return (
    <div className="feature-item">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SectionTitle({ title, text }) {
  return (
    <div className="section-title">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function StatCard({ label, value, tone = 'default' }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="kv-item">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
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
