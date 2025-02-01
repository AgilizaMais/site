import React from 'react';
import { Bot, Workflow, Zap, Shield, Code, MessageSquare } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <header className="bg-[#1b4f8f] text-white">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Workflow className="w-8 h-8" />
            <span className="text-xl font-bold">Agiliza+</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#services" className="hover:text-blue-200">Serviços</a>
            <a href="#about" className="hover:text-blue-200">Sobre</a>
            <a href="#contact" className="hover:text-blue-200">Contato</a>
          </div>
        </nav>
        
        <div className="container mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl font-bold mb-6">Automação que Soma Eficiência</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Transforme sua empresa com soluções de automação inteligente. 
            Economize tempo e aumente a eficiência da sua clínica com nossas automações.
          </p>
          <a 
            href="https://wa.me/5582987518943" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-block bg-[#1b4f8f] hover:bg-[#163f72] text-white px-8 py-3 rounded-lg font-semibold transition-colors border-2 border-white"
          >
            Consulte Nossos Planos
          </a>
        </div>
      </header>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-[#1b4f8f] mb-16">Nossos Serviços</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard 
              icon={<Bot className="w-12 h-12 text-[#1b4f8f]" />}
              title="Agendamentos Automáticos"
              description="Confirmação de consultas, lembretes e reagendamentos via WhatsApp."
            />
            <ServiceCard 
              icon={<Zap className="w-12 h-12 text-[#1b4f8f]" />}
              title="Integração de Sistemas"
              description="Conecte diferentes plataformas e simplifique processos repetitivos."
            />
            <ServiceCard 
              icon={<Shield className="w-12 h-12 text-[#1b4f8f]" />}
              title="Segurança e Confiabilidade"
              description="Implementações seguras e robustas para suas automações críticas."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-blue-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Team working" 
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-[#1b4f8f] mb-6">Por que escolher a Agiliza+?</h2>
              <p className="text-gray-700 mb-6">
                Somos especialistas em automação de sistemas, oferecendo soluções personalizadas 
                que transformam a maneira como sua empresa trabalha. Nossa equipe combina 
                experiência técnica com entendimento profundo de processos de negócio.
              </p>
              <div className="flex items-center space-x-4">
                <Code className="w-6 h-6 text-[#1b4f8f]" />
                <span className="text-gray-700">Mais de 50 integrações realizadas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#1b4f8f] mb-8">Entre em Contato</h2>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="flex items-center justify-center mb-8">
                <MessageSquare className="w-12 h-12 text-[#1b4f8f]" />
              </div>
              <p className="text-gray-700 mb-6">
                Pronto para automatizar seus processos? Entre em contato conosco 
                para consultar nossos planos e fazer seu orçamento. Vem Agilizar +!
              </p>
              <a 
                href="https://wa.me/5582987518943" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block bg-[#1b4f8f] hover:bg-[#163f72] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Consultar Planos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1b4f8f] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Workflow className="w-6 h-6" />
              <span className="font-bold">Agiliza+</span>
            </div>
            <div className="text-sm text-blue-200">
              © 2025 Agiliza+. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#1b4f8f] mb-4 text-center">{title}</h3>
      <p className="text-gray-600 text-center">{description}</p>
    </div>
  );
}

export default App;