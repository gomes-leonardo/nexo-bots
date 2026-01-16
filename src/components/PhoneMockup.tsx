import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";

const messages = [
  { type: "received", text: "Oi! Gostaria de agendar um corte", time: "14:32" },
  { type: "sent", text: "Olá! 👋 Sou o Bigode, assistente virtual da Barbearia. Qual dia prefere?", time: "14:32" },
  { type: "received", text: "Amanhã às 15h pode ser?", time: "14:33" },
  { type: "sent", text: "Perfeito! ✅ Confirmado para amanhã, 15h com o Pedro. Te envio um lembrete!", time: "14:33" },
];

const PhoneMockup = () => {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-75 pointer-events-none" />
      
      {/* Phone frame */}
      <motion.div
        initial={{ scale: 0.95 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        className="relative w-[280px] sm:w-[320px] bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-border/50 p-3 shadow-2xl"
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-background rounded-b-2xl" />
        
        {/* Screen */}
        <div className="bg-background rounded-[2rem] overflow-hidden">
          {/* WhatsApp header */}
          <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary-foreground">
              B
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Barbearia do Zé</p>
              <p className="text-xs text-white/70">online</p>
            </div>
          </div>
          
          {/* Chat messages */}
          <div 
            className="p-3 space-y-2 min-h-[350px]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#0b141a'
            }}
          >
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.3 }}
                className={`flex ${msg.type === "sent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.type === "sent"
                      ? "bg-[#005C4B] text-white rounded-tr-none"
                      : "bg-[#202C33] text-white rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-white/60">{msg.time}</span>
                    {msg.type === "sent" && (
                      <CheckCheck className="w-3 h-3 text-[#53BDEB]" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PhoneMockup;
