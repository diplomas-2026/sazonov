INSERT INTO app_users (full_name, username, password_hash, role, email, phone, active, created_at)
VALUES
    ('Иван Петров', 'ivan.petrov', '{noop}ivan123', 'APPLICANT', 'ivan.petrov@example.com', '+7 (900) 111-11-11', TRUE, CURRENT_TIMESTAMP),
    ('Анна Смирнова', 'anna.smirnova', '{noop}anna123', 'APPLICANT', 'anna.smirnova@example.com', '+7 (900) 222-22-22', TRUE, CURRENT_TIMESTAMP),
    ('Сергей Козлов', 'sergey.kozlov', '{noop}sergey123', 'APPLICANT', 'sergey.kozlov@example.com', '+7 (900) 333-33-33', TRUE, CURRENT_TIMESTAMP),
    ('Ольга Морозова', 'olga.morozova', '{noop}olga123', 'APPLICANT', 'olga.morozova@example.com', '+7 (900) 444-44-44', TRUE, CURRENT_TIMESTAMP),
    ('Дмитрий Васильев', 'dmitry.vasiliev', '{noop}dmitry123', 'APPLICANT', 'dmitry.vasiliev@example.com', '+7 (900) 555-55-55', TRUE, CURRENT_TIMESTAMP);

INSERT INTO admission_applications (
    applicant_id,
    speciality_id,
    status,
    passport_series,
    passport_number,
    snils,
    education_document_number,
    graduation_school,
    graduation_year,
    points,
    applicant_comment,
    staff_comment,
    created_at,
    updated_at
)
VALUES
    (
        (SELECT id FROM app_users WHERE username = 'ivan.petrov'),
        (SELECT id FROM specialities WHERE code = '09.02.07'),
        'SUBMITTED',
        '1234',
        '567890',
        '123-456-789 01',
        'ATTESTAT-1001',
        'Школа №32 г. Самара',
        2025,
        235,
        'Подаю документы на бюджетное место.',
        NULL,
        CURRENT_TIMESTAMP - INTERVAL '10 days',
        CURRENT_TIMESTAMP - INTERVAL '10 days'
    ),
    (
        (SELECT id FROM app_users WHERE username = 'anna.smirnova'),
        (SELECT id FROM specialities WHERE code = '38.02.01'),
        'UNDER_REVIEW',
        '2345',
        '678901',
        '234-567-890 12',
        'ATTESTAT-1002',
        'Колледж экономики и сервиса',
        2024,
        218,
        'Хочу работать в бухгалтерии и финансах.',
        'Проверить копию аттестата и фото.',
        CURRENT_TIMESTAMP - INTERVAL '8 days',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        (SELECT id FROM app_users WHERE username = 'sergey.kozlov'),
        (SELECT id FROM specialities WHERE code = '40.02.04'),
        'MISSING_DOCS',
        '3456',
        '789012',
        '345-678-901 23',
        'ATTESTAT-1003',
        'Лицей №17 г. Самара',
        2025,
        203,
        'Прошу рассмотреть мою заявку.',
        'Не хватает оригинала аттестата.',
        CURRENT_TIMESTAMP - INTERVAL '7 days',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        (SELECT id FROM app_users WHERE username = 'olga.morozova'),
        (SELECT id FROM specialities WHERE code = '09.02.07'),
        'ACCEPTED',
        '4567',
        '890123',
        '456-789-012 34',
        'ATTESTAT-1004',
        'Гимназия №11 г. Тольятти',
        2024,
        247,
        'Есть опыт работы с компьютером и сайтами.',
        'Принято в основную волну, оригиналы предоставлены.',
        CURRENT_TIMESTAMP - INTERVAL '12 days',
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        (SELECT id FROM app_users WHERE username = 'dmitry.vasiliev'),
        (SELECT id FROM specialities WHERE code = '38.02.01'),
        'REJECTED',
        '5678',
        '901234',
        '567-890-123 45',
        'ATTESTAT-1005',
        'Школа №7 г. Самара',
        2025,
        176,
        'Нужна заочная форма обучения.',
        'Отказ из-за несоответствия минимальному проходному баллу.',
        CURRENT_TIMESTAMP - INTERVAL '6 days',
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    );

INSERT INTO application_documents (application_id, type, file_name, content_type, size, data, uploaded_at)
VALUES
    (
        (SELECT id FROM admission_applications WHERE passport_number = '567890'),
        'PASSPORT',
        'passport_ivan_petrov.pdf',
        'application/pdf',
        2048,
        CAST('Passport for Ivan Petrov' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '10 days'
    ),
    (
        (SELECT id FROM admission_applications WHERE passport_number = '567890'),
        'EDUCATION_CERTIFICATE',
        'certificate_ivan_petrov.pdf',
        'application/pdf',
        4096,
        CAST('Education certificate for Ivan Petrov' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '10 days'
    ),
    (
        (SELECT id FROM admission_applications WHERE passport_number = '678901'),
        'PASSPORT',
        'passport_anna_smirnova.pdf',
        'application/pdf',
        2048,
        CAST('Passport for Anna Smirnova' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '8 days'
    ),
    (
        (SELECT id FROM admission_applications WHERE passport_number = '678901'),
        'EDUCATION_CERTIFICATE',
        'certificate_anna_smirnova.pdf',
        'application/pdf',
        4096,
        CAST('Education certificate for Anna Smirnova' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '8 days'
    ),
    (
        (SELECT id FROM admission_applications WHERE passport_number = '678901'),
        'PHOTO',
        'photo_anna_smirnova.jpg',
        'image/jpeg',
        1024,
        CAST('Photo for Anna Smirnova' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '8 days'
    ),
    (
        (SELECT id FROM admission_applications WHERE passport_number = '789012'),
        'PASSPORT',
        'passport_sergey_kozlov.pdf',
        'application/pdf',
        2048,
        CAST('Passport for Sergey Kozlov' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    (
        (SELECT id FROM admission_applications WHERE passport_number = '890123'),
        'PASSPORT',
        'passport_olga_morozova.pdf',
        'application/pdf',
        2048,
        CAST('Passport for Olga Morozova' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '12 days'
    ),
    (
        (SELECT id FROM admission_applications WHERE passport_number = '890123'),
        'EDUCATION_CERTIFICATE',
        'certificate_olga_morozova.pdf',
        'application/pdf',
        4096,
        CAST('Education certificate for Olga Morozova' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '12 days'
    ),
    (
        (SELECT id FROM admission_applications WHERE passport_number = '901234'),
        'PASSPORT',
        'passport_dmitry_vasiliev.pdf',
        'application/pdf',
        2048,
        CAST('Passport for Dmitry Vasiliev' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '6 days'
    ),
    (
        (SELECT id FROM admission_applications WHERE passport_number = '901234'),
        'EDUCATION_CERTIFICATE',
        'certificate_dmitry_vasiliev.pdf',
        'application/pdf',
        4096,
        CAST('Education certificate for Dmitry Vasiliev' AS BYTEA),
        CURRENT_TIMESTAMP - INTERVAL '6 days'
    );
