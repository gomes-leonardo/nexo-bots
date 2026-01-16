import { motion } from "framer-motion";
import { Sparkles, Building2, Clock, Scissors } from "lucide-react";

const products = [
  {
    name: "AYSHA",
    niche: "Estética e Beleza",
    description: "Elegância e organização para clínicas de estética e salões de beleza.",
    status: "soon",
    statusLabel: "Em Breve",
    icon: Sparkles,
    accentColor: "purple",
    gradient: "from-purple-500/20 to-pink-500/10",
    borderColor: "border-purple-500/30",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    name: "IMOB",
    niche: "Imobiliárias",
    description: "Atendimento inteligente para corretores e imobiliárias modernas.",
    status: "planning",
    statusLabel: "Em Planejamento",
    icon: Building2,
    accentColor: "blue",
    gradient: "from-blue-500/20 to-cyan-500/10",
    borderColor: "border-blue-500/30",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
];

const Ecosystem = () => {
  return (
    <section id="ecossistema" className="relative py-24 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent pointer-events-none" />
      
      <div className="container max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border/30">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Em Desenvolvimento</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            O Ecossistema <span className="text-gradient-primary">NEXO</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Uma família de bots especializados, cada um dominando seu nicho.
          </p>
        </motion.div>

        {/* Products grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`glass-card p-6 sm:p-8 relative overflow-hidden group hover:border-${product.accentColor}-500/40 transition-all duration-500`}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${product.iconBg} ${product.borderColor} border flex items-center justify-center`}>
                    <product.icon className={`w-6 h-6 ${product.iconColor}`} />
                  </div>
                  <span className={`status-badge status-${product.status}`}>
                    {product.statusLabel}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">{product.name}</h3>
                  <p className={`text-sm font-medium ${product.iconColor}`}>{product.niche}</p>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>

                {/* Footer */}
                <div className={`pt-4 border-t ${product.borderColor}`}>
                  <p className="text-sm text-muted-foreground">
                    Interessado? Entre em contato para acesso antecipado.
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* BIGODE reminder card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 glass-card p-6 sm:p-8 border-primary/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h3 className="text-xl font-bold text-foreground">BIGODE</h3>
              <p className="text-muted-foreground">O primeiro e já operacional. Perfeito para barbearias.</p>
            </div>
            <span className="status-badge status-available">
              ✓ Disponível Agora
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Ecosystem;
