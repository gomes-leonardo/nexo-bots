import { motion } from "framer-motion";
import { MessageSquare, Calendar, CheckCircle, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhoneMockup from "@/components/PhoneMockup";

const FlagshipProduct = () => {
  return (
    <section id="bigode" className="relative py-24 px-4 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <span className="status-badge status-available">
                <CheckCircle className="w-3 h-3" />
                Disponível Agora
              </span>
              <span className="status-badge bg-card/60 border border-border/30 text-muted-foreground">
                <Scissors className="w-3 h-3" />
                Barbearias
              </span>
            </div>

            {/* Product name */}
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold">
                <span className="text-foreground">Conheça o </span>
                <span className="text-gradient-primary">BIGODE</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                O recepcionista virtual definitivo para Barbearias. 
                Agenda cheia, zero no-show e o barbeiro focado apenas no corte.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-4">
              {[
                { icon: MessageSquare, text: "Responde clientes 24/7 via WhatsApp" },
                { icon: Calendar, text: "Agenda automática com confirmação" },
                { icon: CheckCircle, text: "Reduz no-shows em até 80%" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <Button variant="hero" size="lg" className="group">
              Quero o Bigode na minha Barbearia
            </Button>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FlagshipProduct;
