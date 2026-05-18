const fs = require('node:fs/promises');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const SHOTS_DIR = path.resolve(__dirname, '..', 'artifacts', 'screenshots');

async function shot(page, name) {
  await fs.mkdir(SHOTS_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(SHOTS_DIR, name),
    fullPage: true,
  });
}

async function openAuth(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const logoutBtn = page.getByRole('button', { name: 'Выйти' });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForLoadState('domcontentloaded');
  }
  const loginBtn = page.getByRole('button', { name: /^Войти$/ });
  await loginBtn.first().click();
  await expect(page.getByRole('heading', { name: 'Авторизация' })).toBeVisible();
}

async function login(page, username, password) {
  await openAuth(page);
  await page.getByLabel('Логин').fill(username);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: /^Войти$/ }).last().click();
  await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
}

test.beforeAll(async () => {
  await fs.rm(SHOTS_DIR, { recursive: true, force: true });
  await fs.mkdir(SHOTS_DIR, { recursive: true });
});

test('01 public screens', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await shot(page, '01-public-home.png');

  await page.getByRole('button', { name: /Вход|Войти/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Авторизация' })).toBeVisible();
  await shot(page, '02-auth-login.png');

  await page.getByRole('tab', { name: 'Регистрация' }).click();
  await expect(page.getByRole('button', { name: 'Создать аккаунт' })).toBeVisible();
  await shot(page, '03-auth-register-tab.png');
});

test('02 applicant screens', async ({ page }) => {
  await login(page, 'ivan.petrov', 'ivan123');

  await page.getByRole('tab', { name: 'Заявки' }).click();
  await expect(page.getByRole('button', { name: 'Создать заявку' })).toBeVisible();
  await shot(page, '04-applicant-applications-list.png');

  await page.getByRole('button', { name: 'Создать заявку' }).click();
  await expect(page.getByText('Создание заявки')).toBeVisible();
  await shot(page, '05-applicant-create-application.png');

  await page.getByRole('tab', { name: 'Отделения' }).click();
  await expect(page.getByRole('heading', { name: 'Отделения' })).toBeVisible();
  await shot(page, '06-applicant-departments.png');

  await page.getByRole('tab', { name: 'Конкурс' }).click();
  await expect(page.getByText('Конкурсный список')).toBeVisible();
  await shot(page, '07-applicant-leaderboard.png');
});

test('03 staff screens', async ({ page }) => {
  await login(page, 'staff', 'staff123');

  await page.getByRole('tab', { name: 'Очередь' }).click();
  await expect(page.getByText('Канбан заявок')).toBeVisible();
  await shot(page, '08-staff-kanban.png');

  const firstApplication = page.getByText(/Заявка №/).first();
  if (await firstApplication.isVisible()) {
    await firstApplication.click();
    await expect(page.getByText('Подробности заявки')).toBeVisible();
    await shot(page, '09-staff-application-details.png');
  } else {
    await shot(page, '09-staff-application-details.png');
  }

  await page.getByRole('tab', { name: 'Конкурс' }).click();
  await expect(page.getByText('Конкурсный список')).toBeVisible();
  await shot(page, '10-staff-leaderboard.png');
});

test('04 admin screens', async ({ page }) => {
  await login(page, 'admin', 'admin123');

  await page.getByRole('tab', { name: 'Сводка' }).click();
  await expect(page.getByRole('heading', { name: 'Админ-панель' })).toBeVisible();
  await shot(page, '11-admin-dashboard.png');

  await page.getByRole('tab', { name: 'Заявки' }).click();
  await expect(page.getByText('Канбан заявок')).toBeVisible();
  await shot(page, '12-admin-applications-kanban.png');

  await page.getByRole('tab', { name: 'Отделения' }).click();
  await expect(page.getByRole('heading', { name: 'Отделения' })).toBeVisible();
  await shot(page, '13-admin-departments.png');

  await page.getByRole('tab', { name: 'Специальности' }).click();
  await expect(page.getByRole('heading', { name: 'Специальности' })).toBeVisible();
  await shot(page, '14-admin-specialities.png');

  await page.getByRole('tab', { name: 'Пользователи' }).click();
  await expect(page.getByRole('heading', { name: 'Пользователи' })).toBeVisible();
  await shot(page, '15-admin-users.png');
});
