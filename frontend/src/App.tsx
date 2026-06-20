import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { RootLayout } from '@/components/layout/RootLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { HomePage } from '@/pages/HomePage'
import { BookingPage } from '@/pages/BookingPage'
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage'
import { AdminEventTypesPage } from '@/pages/admin/AdminEventTypesPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="book/:eventTypeId" element={<BookingPage />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminBookingsPage />} />
                <Route path="event-types" element={<AdminEventTypesPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
