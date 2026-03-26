export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const msg = params.msg as string | undefined

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-red-500 font-bold text-lg">Authentication Error</p>
        <p className="text-slate-600 mt-2">{msg || "Sorry, something went wrong with authentication."}</p>
        <a href="/login" className="text-blue-500 hover:underline mt-4 inline-block">Return to Login</a>
      </div>
    </div>
  )
}
