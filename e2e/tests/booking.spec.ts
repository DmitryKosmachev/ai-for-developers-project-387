import { test, expect, type Page } from '@playwright/test'

/** Открывает первый тип встречи и выбирает первый свободный слот.
 *  Возвращает текст выбранного времени (например, "11:30"). */
async function openBookingAndPickSlot(page: Page): Promise<string> {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /Записаться на созвон к/ }),
  ).toBeVisible()

  // На карточке типа встречи — ссылка «Записаться».
  await page.getByRole('link', { name: 'Записаться' }).first().click()

  // Сетка свободного времени (не путать с переключателем темы — он тоже radiogroup).
  const slots = page
    .getByRole('radiogroup', { name: /Свободное время/ })
    .getByRole('radio')
  await expect(slots.first()).toBeVisible()

  const firstSlot = slots.first()
  const time = ((await firstSlot.textContent()) ?? '').trim()
  await firstSlot.click()
  return time
}

test('основной сценарий: гость бронирует слот и видит подтверждение', async ({
  page,
}) => {
  const email = `guest+${Date.now()}@example.com`
  const time = await openBookingAndPickSlot(page)

  await page.getByLabel('Имя').fill('Иван Тестов')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Комментарий').fill('Обсудить интеграцию')

  await page.getByRole('button', { name: 'Записаться' }).click()

  // Экран подтверждения с выбранным временем и данными гостя.
  await expect(page.getByText('Вы записаны!')).toBeVisible()
  await expect(page.getByText(new RegExp(time)).first()).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
})

test('владелец видит созданную бронь в админке', async ({ page }) => {
  const email = `owner-check+${Date.now()}@example.com`
  await openBookingAndPickSlot(page)

  await page.getByLabel('Имя').fill('Гость Админ')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Записаться' }).click()
  await expect(page.getByText('Вы записаны!')).toBeVisible()

  await page.goto('/admin')
  await expect(
    page.getByRole('heading', { name: 'Панель владельца' }),
  ).toBeVisible()
  // Созданная встреча присутствует в списке предстоящих.
  await expect(page.getByText(email)).toBeVisible()
  await expect(page.getByText('Гость Админ')).toBeVisible()
})

test('форма не отправляется без обязательных полей', async ({ page }) => {
  await openBookingAndPickSlot(page)

  // Отправляем форму с пустыми полями.
  await page.getByRole('button', { name: 'Записаться' }).click()

  await expect(page.getByText('Укажите имя')).toBeVisible()
  await expect(page.getByText('Укажите email')).toBeVisible()
  // Подтверждения не было — бронь не создана.
  await expect(page.getByText('Вы записаны!')).toHaveCount(0)
})
