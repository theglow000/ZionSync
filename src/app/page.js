import SignupSheet from '@/components/SignupSheet'

export default function Home() {
  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url("/palms.jpg")' }}>
      <main className="p-8">
        <SignupSheet />
      </main>
    </div>
  )
}