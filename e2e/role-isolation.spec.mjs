import { expect, test } from '@playwright/test';

const CLIENT_EMAIL = 'e2e.client@maestro.test';
const SPECIALIST_EMAIL = 'e2e.specialist@maestro.test';
const PASSWORD = 'Password123!';

async function login(page, email, password) {
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

async function authedRequest(page, method, path, body = null) {
  return page.evaluate(
    async ({ method, path, body }) => {
      const token = sessionStorage.getItem('accessToken') || sessionStorage.getItem('access_token');
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      };
      const response = await fetch(path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
      return { status: response.status, data };
    },
    { method, path, body }
  );
}

test('roles stay isolated across two tabs and chat works both ways', async ({ browser }) => {
  const context = await browser.newContext();
  const clientTab = await context.newPage();
  const specialistTab = await context.newPage();

  await login(clientTab, CLIENT_EMAIL, PASSWORD);
  await login(specialistTab, SPECIALIST_EMAIL, PASSWORD);

  await expect(clientTab).toHaveURL(/#\/client/);
  await expect(specialistTab).toHaveURL(/#\/specialist\/dashboard/);

  const clientMe = await authedRequest(clientTab, 'GET', '/api/auth/me/');
  const specialistMe = await authedRequest(specialistTab, 'GET', '/api/auth/me/');
  expect(clientMe.status).toBe(200);
  expect(specialistMe.status).toBe(200);
  expect(clientMe.data.role).toBe('CLIENT');
  expect(specialistMe.data.role).toBe('SPECIALIST');

  const clientAccessToken = await clientTab.evaluate(() => sessionStorage.getItem('accessToken'));
  const specialistAccessToken = await specialistTab.evaluate(() => sessionStorage.getItem('accessToken'));
  expect(clientAccessToken).toBeTruthy();
  expect(specialistAccessToken).toBeTruthy();
  expect(clientAccessToken).not.toBe(specialistAccessToken);

  // Cross-role route guards must still work in each tab.
  await clientTab.goto('/#/specialist/dashboard');
  await expect(clientTab).toHaveURL(/#\/client/);

  await specialistTab.goto('/#/client/create-task');
  await expect(specialistTab).toHaveURL(/#\/specialist\/dashboard/);

  // Create task as client.
  const taskCreate = await authedRequest(clientTab, 'POST', '/api/tasks/', {
    title: 'E2E Task: role isolation',
    description: 'Task created during browser E2E',
    category: 'IT и фриланс',
    budget: '120000 UZS',
    location: 'Ташкент',
  });
  expect(taskCreate.status).toBe(201);
  const taskId = taskCreate.data.id;

  // Respond as specialist.
  const responseCreate = await authedRequest(specialistTab, 'POST', '/api/responses/', {
    task: taskId,
    message: 'E2E specialist response',
    price: 110000,
  });
  expect(responseCreate.status).toBe(201);

  // Open direct chat and exchange messages.
  await clientTab.goto(`/#/messages?participantId=${specialistMe.data.id}`);
  await expect(clientTab.getByTestId('chat-input')).toBeVisible();

  const clientMessageText = 'Client -> Specialist (E2E)';
  await clientTab.getByTestId('chat-input').fill(clientMessageText);
  await clientTab.getByTestId('chat-send').click();
  await expect(clientTab.getByText(clientMessageText)).toBeVisible();

  // Server may not broadcast in environments without Redis; reload to verify persisted chat history.
  await specialistTab.goto(`/#/messages?participantId=${clientMe.data.id}`);
  await specialistTab.reload();
  await specialistTab.goto(`/#/messages?participantId=${clientMe.data.id}`);
  await expect(specialistTab.getByText(clientMessageText)).toBeVisible();

  const specialistMessageText = 'Specialist -> Client (E2E)';
  await specialistTab.getByTestId('chat-input').fill(specialistMessageText);
  await specialistTab.getByTestId('chat-send').click();
  await expect(specialistTab.getByText(specialistMessageText)).toBeVisible();

  await clientTab.reload();
  await clientTab.goto(`/#/messages?participantId=${specialistMe.data.id}`);
  await expect(clientTab.getByText(specialistMessageText)).toBeVisible();

  // Final role check: tabs must not "become" each other after chat flow.
  const clientMeAfter = await authedRequest(clientTab, 'GET', '/api/auth/me/');
  const specialistMeAfter = await authedRequest(specialistTab, 'GET', '/api/auth/me/');
  expect(clientMeAfter.data.role).toBe('CLIENT');
  expect(specialistMeAfter.data.role).toBe('SPECIALIST');
});
