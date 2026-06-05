import loadingLogo from "@/assets/lifting-loading-logo.png"

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = "Carregando..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="relative flex items-center justify-center">
        {/* Anel externo girando */}
        <span
          className="absolute h-20 w-20 rounded-full border-4 border-[#DDE8E2] border-t-[#00A859]"
          style={{ animation: "ptl-spin 0.9s linear infinite" }}
        />
        {/* Anel interno girando ao contrário, mais devagar */}
        <span
          className="absolute h-12 w-12 rounded-full border-4 border-[#DDE8E2] border-b-[#39D98A]"
          style={{ animation: "ptl-spin-rev 1.4s linear infinite" }}
        />
        {/* Logo no centro */}
        <img
          src={loadingLogo}
          alt="Lifting"
          className="relative h-7 w-7 object-contain"
          style={{ animation: "ptl-pulse 1.8s ease-in-out infinite" }}
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-black text-[#073B2A]">{message}</p>
        <div className="mx-auto mt-3 h-1 w-32 overflow-hidden rounded-full bg-[#DDE8E2]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00A859] to-[#39D98A]"
            style={{ animation: "ptl-bar 1.6s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  )
}
