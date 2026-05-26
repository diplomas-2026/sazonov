### Рисунок 2.21 – Реализациярегистрации и авторизации в AuthController

### [Скрин кода](./img_1.png)

```java
@PostMapping("/register")
public UserResponse register(@Valid @RequestBody AuthRegisterRequest request) {
    AppUser user = authService.registerApplicant(request);
    return ApiMapper.userResponse(user);
}

@PostMapping("/login")
public AuthLoginResponse login(@Valid @RequestBody AuthLoginRequest request) {
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.username(), request.password())
    );
    return current(authentication.getName());
}

private AuthLoginResponse current(String username) {
    AppUser current = authService.getByUsername(username);
    String token = jwtService.generateToken(current);
    return new AuthLoginResponse(token, "Bearer", ApiMapper.userResponse(current), java.util.List.of(current.getRole()));
}
```

### Рисунок 2.22 – Реализацияролевой навигации в App.js

### [Скрин кода](./img_2.png)

```javascript
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
```

### Рисунок 2.23 – Реализацияработы абитуриента с заявками в ApplicantController

### [Скрин кода](./img_3.png)

```java
@GetMapping("/applications")
public List<ApplicationResponse> myApplications(Authentication authentication) {
    return applicationService.listForCurrentUser(authentication).stream()
        .map(ApiMapper::applicationResponse)
        .toList();
}

@PostMapping("/applications")
public ApplicationResponse create(Authentication authentication, @Valid @RequestBody ApplicationCreateRequest request) {
    AdmissionApplication application = applicationService.createApplication(authentication, request);
    return ApiMapper.applicationResponse(application);
}

@PutMapping("/applications/{id}")
public ApplicationResponse update(Authentication authentication,
                                  @PathVariable Long id,
                                  @Valid @RequestBody ApplicationUpdateRequest request) {
    return ApiMapper.applicationResponse(applicationService.updateApplication(authentication, id, request));
}

@PostMapping("/applications/{id}/cancel")
public ApplicationResponse cancel(Authentication authentication, @PathVariable Long id) {
    return ApiMapper.applicationResponse(applicationService.cancelApplication(authentication, id));
}
```

### Рисунок 2.24 – Реализациябизнес-логики заявлений в ApplicationService

### [Скрин кода](./img_4.png)

```java
public AdmissionApplication createApplication(Authentication authentication, ApplicationCreateRequest request) {
    AppUser user = currentUser(authentication);
    Speciality speciality = specialityRepository.findById(request.specialityId())
        .orElseThrow(() -> new IllegalArgumentException("Специальность не найдена"));
    if (applicationRepository.existsByApplicantUsernameAndSpecialityId(user.getUsername(), speciality.getId())) {
        throw new IllegalStateException("Вы уже подали заявку на эту специальность");
    }

    AdmissionApplication application = new AdmissionApplication();
    application.setApplicant(user);
    application.setSpeciality(speciality);
    application.setPassportSeries(request.passportSeries().trim());
    application.setPassportNumber(request.passportNumber().trim());
    application.setSnils(request.snils().trim());
    application.setEducationDocumentNumber(request.educationDocumentNumber().trim());
    application.setGraduationSchool(request.graduationSchool().trim());
    application.setGraduationYear(request.graduationYear());
    application.setPoints(request.points());
    application.setApplicantComment(request.applicantComment());
    application.setStatus(ApplicationStatus.SUBMITTED);
    return applicationRepository.save(application);
}

public AdmissionApplication updateApplication(Authentication authentication, Long id, ApplicationUpdateRequest request) {
    AdmissionApplication application = applicationRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
    AppUser user = currentUser(authentication);
    if (!application.getApplicant().getUsername().equals(user.getUsername())) {
        throw new AccessDeniedException("Можно редактировать только свою заявку");
    }
    if (application.getStatus() == ApplicationStatus.ACCEPTED
        || application.getStatus() == ApplicationStatus.REJECTED
        || application.getStatus() == ApplicationStatus.CANCELLED) {
        throw new IllegalStateException("Эту заявку уже нельзя редактировать");
    }

    Speciality speciality = specialityRepository.findById(request.specialityId())
        .orElseThrow(() -> new IllegalArgumentException("Специальность не найдена"));
    if (applicationRepository.existsByApplicantUsernameAndSpecialityIdAndIdNot(user.getUsername(), speciality.getId(), application.getId())) {
        throw new IllegalStateException("Вы уже подали заявку на эту специальность");
    }

    application.setSpeciality(speciality);
    application.setPassportSeries(request.passportSeries().trim());
    application.setPassportNumber(request.passportNumber().trim());
    application.setSnils(request.snils().trim());
    application.setEducationDocumentNumber(request.educationDocumentNumber().trim());
    application.setGraduationSchool(request.graduationSchool().trim());
    application.setGraduationYear(request.graduationYear());
    application.setPoints(request.points());
    application.setApplicantComment(request.applicantComment());
    application.touch();
    return applicationRepository.save(application);
}
```

### Рисунок 2.25 – Реализацияфункций сотрудника приемной комиссии в StaffController

### [Скрин кода](./img_5.png)

```java
@GetMapping("/applications")
public List<ApplicationResponse> list(@RequestParam(value = "status", required = false) com.github.danbel.sazonovapi.domain.ApplicationStatus status) {
    return applicationService.listForStaff(Optional.ofNullable(status)).stream()
        .map(ApiMapper::applicationResponse)
        .toList();
}

@PatchMapping("/applications/{id}/status")
public ApplicationResponse updateStatus(@PathVariable Long id, @Valid @RequestBody ApplicationStatusUpdateRequest request) {
    AdmissionApplication application = applicationService.updateStatus(id, request);
    return ApiMapper.applicationResponse(application);
}

@GetMapping("/applications/{id}")
public ApplicationResponse one(Authentication authentication, @PathVariable Long id) {
    return ApiMapper.applicationResponse(applicationService.getApplication(authentication, id));
}
```

### Рисунок 2.26 – Реализацияадминистративных функций в AdminController

### [Скрин кода](./img_6.png)

```java
@GetMapping("/departments")
public List<DepartmentResponse> departments() {
    return departmentService.list().stream().map(ApiMapper::departmentResponse).toList();
}

@PostMapping("/departments")
public DepartmentResponse createDepartment(@Valid @RequestBody DepartmentUpsertRequest request) {
    return ApiMapper.departmentResponse(departmentService.create(request));
}

@PutMapping("/departments/{id}")
public DepartmentResponse updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentUpsertRequest request) {
    return ApiMapper.departmentResponse(departmentService.update(id, request));
}

@DeleteMapping("/departments/{id}")
public void deleteDepartment(@PathVariable Long id) {
    departmentService.delete(id);
}

@GetMapping("/users")
public List<UserResponse> users() {
    return authService.listUsers().stream().map(ApiMapper::userResponse).toList();
}

@PostMapping("/users")
public UserResponse createUser(@Valid @RequestBody UserCreateRequest request) {
    AppUser user = authService.createUser(request);
    return ApiMapper.userResponse(user);
}
```

### Рисунок 2.27 – Реализациячата по заявлению в ChatController

### [Скрин кода](./img_7.png)

```java
@GetMapping("/applications/{id}/messages")
public List<ChatMessageResponse> messages(Authentication authentication, @PathVariable Long id) {
    return chatService.listMessages(authentication, id).stream()
        .map(ApiMapper::chatMessageResponse)
        .toList();
}

@GetMapping("/applications/{id}/messages/last")
public ChatLastMessageResponse lastMessage(Authentication authentication, @PathVariable Long id) {
    return chatService.lastMessage(authentication, id);
}

@PostMapping("/applications/{id}/messages")
public ChatMessageResponse send(Authentication authentication,
                                @PathVariable Long id,
                                @Valid @RequestBody ChatMessageCreateRequest request) {
    return ApiMapper.chatMessageResponse(chatService.sendMessage(authentication, id, request));
}
```

### Рисунок 2.28 – Реализацияпубличных данных в PublicController

### [Скрин кода](./img_8.png)

```java
@GetMapping("/departments")
public List<DepartmentResponse> departments() {
    return departmentService.list().stream().map(ApiMapper::departmentResponse).toList();
}

@GetMapping("/specialities")
public List<SpecialityResponse> specialities() {
    return specialityService.list().stream().map(ApiMapper::specialityResponse).toList();
}

@GetMapping("/dashboard")
public DashboardResponse dashboard() {
    return dashboardService.getDashboard();
}

@GetMapping("/leaderboard")
public LeaderboardResponse leaderboard() {
    return leaderboardService.getLeaderboard();
}
```

### Рисунок 2.29 – Реализациязапросов к API в файле api.js

### [Скрин кода](./img_9.png)

```javascript
async function request(path, { token, method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload && typeof payload === 'object' ? payload.message : payload;
    throw new Error(message || 'Не удалось выполнить запрос');
  }

  return payload;
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  publicDepartments: () => request('/public/departments'),
  applicantApplications: (token) => request('/applicant/applications', { token }),
  staffUpdateStatus: (token, id, payload) =>
    request(`/staff/applications/${id}/status`, { token, method: 'PATCH', body: payload }),
  adminUsers: (token) => request('/admin/users', { token }),
};
```

### Рисунок 2.30 – Реализациязагрузки данных и обработки ролей в App.js

### [Скрин кода](./img_10.png)

```javascript
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
```

### Рисунок 2.31 – Реализацияконкурсного рейтинга в клиентской части

### [Скрин кода](./img_11.png)

```javascript
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
                        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
                          #{entry.rank}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {entry.fullName}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {formatAverageScore(entry.points)}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
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
```

### Листинг кода программного продукта страниц на 3-4.

```java
public AdmissionApplication createApplication(Authentication authentication, ApplicationCreateRequest request) {
    AppUser user = currentUser(authentication);
    Speciality speciality = specialityRepository.findById(request.specialityId())
        .orElseThrow(() -> new IllegalArgumentException("Специальность не найдена"));
    if (applicationRepository.existsByApplicantUsernameAndSpecialityId(user.getUsername(), speciality.getId())) {
        throw new IllegalStateException("Вы уже подали заявку на эту специальность");
    }

    AdmissionApplication application = new AdmissionApplication();
    application.setApplicant(user);
    application.setSpeciality(speciality);
    application.setPassportSeries(request.passportSeries().trim());
    application.setPassportNumber(request.passportNumber().trim());
    application.setSnils(request.snils().trim());
    application.setEducationDocumentNumber(request.educationDocumentNumber().trim());
    application.setGraduationSchool(request.graduationSchool().trim());
    application.setGraduationYear(request.graduationYear());
    application.setPoints(request.points());
    application.setApplicantComment(request.applicantComment());
    application.setStatus(ApplicationStatus.SUBMITTED);
    return applicationRepository.save(application);
}

public AdmissionApplication updateApplication(Authentication authentication, Long id, ApplicationUpdateRequest request) {
    AdmissionApplication application = applicationRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
    AppUser user = currentUser(authentication);
    if (!application.getApplicant().getUsername().equals(user.getUsername())) {
        throw new AccessDeniedException("Можно редактировать только свою заявку");
    }
    if (application.getStatus() == ApplicationStatus.ACCEPTED
        || application.getStatus() == ApplicationStatus.REJECTED
        || application.getStatus() == ApplicationStatus.CANCELLED) {
        throw new IllegalStateException("Эту заявку уже нельзя редактировать");
    }

    Speciality speciality = specialityRepository.findById(request.specialityId())
        .orElseThrow(() -> new IllegalArgumentException("Специальность не найдена"));
    if (applicationRepository.existsByApplicantUsernameAndSpecialityIdAndIdNot(user.getUsername(), speciality.getId(), application.getId())) {
        throw new IllegalStateException("Вы уже подали заявку на эту специальность");
    }

    application.setSpeciality(speciality);
    application.setPassportSeries(request.passportSeries().trim());
    application.setPassportNumber(request.passportNumber().trim());
    application.setSnils(request.snils().trim());
    application.setEducationDocumentNumber(request.educationDocumentNumber().trim());
    application.setGraduationSchool(request.graduationSchool().trim());
    application.setGraduationYear(request.graduationYear());
    application.setPoints(request.points());
    application.setApplicantComment(request.applicantComment());
    application.touch();
    return applicationRepository.save(application);
}

public AdmissionApplication cancelApplication(Authentication authentication, Long id) {
    AdmissionApplication application = applicationRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
    AppUser user = currentUser(authentication);
    if (!application.getApplicant().getUsername().equals(user.getUsername())) {
        throw new AccessDeniedException("Можно отменить только свою заявку");
    }
    if (application.getStatus() == ApplicationStatus.CANCELLED) {
        throw new IllegalStateException("Заявка уже отменена");
    }
    if (application.getStatus() == ApplicationStatus.ACCEPTED || application.getStatus() == ApplicationStatus.REJECTED) {
        throw new IllegalStateException("Эту заявку нельзя отменить");
    }
    application.setStatus(ApplicationStatus.CANCELLED);
    application.touch();
    return applicationRepository.save(application);
}

public List<AdmissionApplication> listForStaff(Optional<ApplicationStatus> status) {
    List<AdmissionApplication> all = status
        .map(applicationRepository::findByStatusOrderByCreatedAtDesc)
        .orElseGet(applicationRepository::findAll);
    return all.stream()
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .toList();
}

public AdmissionApplication getApplication(Authentication authentication, Long id) {
    AdmissionApplication application = applicationRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
    AppUser user = currentUser(authentication);
    if (user.getRole() == Role.ADMIN || user.getRole() == Role.STAFF
        || application.getApplicant().getUsername().equals(user.getUsername())) {
        return application;
    }
    throw new AccessDeniedException("Нет доступа к заявке");
}

public AdmissionApplication updateStatus(Long id, ApplicationStatusUpdateRequest request) {
    AdmissionApplication application = applicationRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
    application.setStatus(request.status());
    application.setStaffComment(request.staffComment());
    application.touch();
    return applicationRepository.save(application);
}
```
