import { motion } from "framer-motion";
import { Clock, Users, Code2 } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Atendimento 24/7",
    description: "O robô nunca dorme. Seus clientes são atendidos a qualquer hora, todos os dias.",
  },
  {
    icon: Users,
    title: "Fila Inteligente",
    description: "Estilo Outback, sem confusão. Organização automática de agendamentos e lembretes.",
  },
  {
    icon: Code2,
    title: "Tecnologia Sênior",
    description: "Feito com código de verdade, não é gambiarra. Infraestrutura robusta e confiável.",
  },
];

const Benefits = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="container max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Por que <span className="text-gradient-primary">NEXO</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Automação séria para negócios sérios. Sem improviso.
          </p>
        </motion.div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="glass-card p-6 sm:p-8 group hover:border-primary/30 transition-all duration-500"
            >
              <div className="space-y-4">
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
