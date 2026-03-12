import { redirect } from 'next/navigation'
import { auth, signIn } from '@/lib/auth/options'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/')

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="animate-page-enter flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-5xl font-normal tracking-tight text-[#2C2825]">
            Muse
          </h1>
          <p className="text-[#8B7D72] text-sm">A space to remember yourself</p>
        </div>

        <div className="bg-white border border-[#E8E2D9] rounded-xl p-8 w-full shadow-sm space-y-6">
          <div className="text-center">
            <p className="text-[#2C2825] font-medium">Welcome back</p>
            <p className="text-[#B5A99F] text-sm mt-1">Sign in to continue your journey</p>
          </div>

          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/' })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-[#E8E2D9] bg-white hover:bg-[#F2EEE8] transition-colors duration-150 text-sm font-medium text-[#2C2825]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z"
      />
      <path
        fill="#FBBC05"
        d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07Z"
      />
      <path
        fill="#EA4335"
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3Z"
      />
    </svg>
  )
}
