import { CheckCircle } from 'lucide-react'

// 1. Kartın alabileceği verileri tanımlıyoruz (Props)
interface DemoNFTCardProps {
    image: string          // Resim yolu (örn: /Gemini.png)
    title: string          // Başlık (örn: Move Master)
    level: number          // Seviye (örn: 5)
    rank: string           // Rütbe (örn: Legend)
    hours: number          // Saat (örn: 200)
    isActivePFP?: boolean  // Profil fotosu mu?
    onClick?: () => void   // Tıklanınca ne olsun?
}

export function DemoNFTCard({
    image,
    title,
    level,
    rank,
    hours,
    isActivePFP = false,
    onClick
}: DemoNFTCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
                relative bg-white/5 backdrop-blur-sm border rounded-3xl p-5 
                flex flex-col items-center gap-4 cursor-pointer
                transition-all duration-300 group hover:scale-[1.02]
                ${isActivePFP
                    ? 'border-cyan-500/50 ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#09090b] shadow-lg shadow-cyan-500/20'
                    : 'border-white/5 hover:border-cyan-500/30 hover:bg-white/10'
                }
            `}
        >

            {/* Active PFP Badge */}
            {isActivePFP && (
                <div className="absolute -top-2 -right-2 bg-cyan-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg z-20">
                    <CheckCircle size={10} />
                    Active
                </div>
            )}

            {/* NFT Image Container */}
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

                {/* Dinamik Resim */}
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
            </div>

            {/* Badge Info */}
            <div className="w-full text-center space-y-2">
                <h4 className="text-lg font-bold text-white truncate">{title}</h4>
                <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-cyan-400 font-medium">Level {level}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{rank}</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                    <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                            style={{ width: '85%' }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500">
                        <span>{hours}h</span>
                        <span>Next: Lvl {level + 1}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}