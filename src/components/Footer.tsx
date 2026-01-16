import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="relative py-12 px-4 border-t border-border/30">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          {/* Logo and copyright */}
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-gradient-primary">NEXO</span>
            <span className="text-muted-foreground">© 2025</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Contato para Parcerias
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
