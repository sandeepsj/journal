import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardPage } from '@/pages/DashboardPage'
import { EditorPage } from '@/pages/EditorPage'
import { RecallPage } from '@/pages/RecallPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/journal/new" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
            <Route path="/journal/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
            <Route path="/recall" element={<ProtectedRoute><RecallPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
