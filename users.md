# Test Users

Below are the demo accounts and seed data used by the Flyway migrations.

## Login Data

| Role | Full name | Username | Password | Email | Phone |
|---|---|---|---|---|---|
| Admin | Администратор ПГК | `admin` | `admin123` | `admin@pgk.local` | `+7 (900) 000-00-01` |
| Staff | Сотрудник приемной комиссии | `staff` | `staff123` | `staff@pgk.local` | `+7 (900) 000-00-02` |
| Applicant | Иван Петров | `ivan.petrov` | `ivan123` | `ivan.petrov@example.com` | `+7 (900) 111-11-11` |
| Applicant | Анна Смирнова | `anna.smirnova` | `anna123` | `anna.smirnova@example.com` | `+7 (900) 222-22-22` |
| Applicant | Сергей Козлов | `sergey.kozlov` | `sergey123` | `sergey.kozlov@example.com` | `+7 (900) 333-33-33` |
| Applicant | Ольга Морозова | `olga.morozova` | `olga123` | `olga.morozova@example.com` | `+7 (900) 444-44-44` |
| Applicant | Дмитрий Васильев | `dmitry.vasiliev` | `dmitry123` | `dmitry.vasiliev@example.com` | `+7 (900) 555-55-55` |

## Copy-Paste Logins

```text
admin / admin123
staff / staff123
ivan.petrov / ivan123
anna.smirnova / anna123
sergey.kozlov / sergey123
olga.morozova / olga123
dmitry.vasiliev / dmitry123
```

## Demo Applications

| Applicant | Speciality | Status | Comment | Staff note |
|---|---|---|---|---|
| Иван Петров | 09.02.07 Информационные системы и программирование | Submitted | Подаю документы на бюджетное место. | - |
| Анна Смирнова | 38.02.01 Экономика и бухгалтерский учет | Under review | Хочу работать в бухгалтерии и финансах. | Проверить копию аттестата и фото. |
| Сергей Козлов | 40.02.04 Юриспруденция | Missing docs | Прошу рассмотреть мою заявку. | Не хватает оригинала аттестата. |
| Ольга Морозова | 09.02.07 Информационные системы и программирование | Accepted | Есть опыт работы с компьютером и сайтами. | Принято в основную волну, оригиналы предоставлены. |
| Дмитрий Васильев | 38.02.01 Экономика и бухгалтерский учет | Rejected | Нужна заочная форма обучения. | Отказ из-за несоответствия минимальному проходному баллу. |

## Useful Notes

- Admin can manage users, specialities, and view statistics.
- Staff can review all applications and change statuses.
- Applicants can create applications, upload documents, and track status.
- Demo documents are attached to all applications except "submitted" cases with minimal set.
