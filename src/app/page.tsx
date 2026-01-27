import Link from 'next/link';
import { Logo } from '@/components/layout';
import { Button } from '@/components/ui';
import { Heart, Shield, Users, Brain, MessageCircle, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link href="/auth">
            <Button variant="primary">Iniciar sesión</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 gradient-primary text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Tu bienestar mental importa
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Orientación en salud mental primaria con inteligencia artificial.
              Un primer paso hacia tu bienestar emocional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-[var(--primary)] hover:bg-gray-100 border-white w-full sm:w-auto"
                >
                  Comenzar ahora
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  Conoce más
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Banner */}
      <section className="bg-yellow-50 border-y border-yellow-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-sm text-yellow-800 text-center">
            <strong>Importante:</strong> Este servicio brinda orientación general y psicoeducación.
            No reemplaza el diagnóstico ni tratamiento de un profesional de salud mental.
            Si estás en crisis o emergencia, llama al <strong>123</strong> (Colombia).
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Cómo funciona?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Un proceso simple y seguro para recibir orientación inicial
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Conversa</h3>
              <p className="text-gray-600">
                Comparte cómo te sientes con nuestro asistente de IA especializado en salud mental primaria.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Recibe orientación</h3>
              <p className="text-gray-600">
                Obtén información, recursos y recomendaciones generales basadas en tu situación.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Conecta con expertos</h3>
              <p className="text-gray-600">
                Si es necesario, te conectamos con psicólogos profesionales especializados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tu seguridad es prioridad</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Shield className="w-10 h-10 text-[var(--primary)] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Privacidad protegida</h3>
              <p className="text-gray-600 text-sm">
                Tus conversaciones son confidenciales. Cumplimos con estándares de protección de datos.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Heart className="w-10 h-10 text-[var(--primary)] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Protocolo de crisis</h3>
              <p className="text-gray-600 text-sm">
                Si detectamos riesgo, activamos protocolos de emergencia y recursos de ayuda inmediata.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Clock className="w-10 h-10 text-[var(--primary)] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Disponible 24/7</h3>
              <p className="text-gray-600 text-sm">
                Accede cuando lo necesites. La orientación inicial está siempre disponible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--primary)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Da el primer paso hacia tu bienestar
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            No tienes que enfrentar esto solo/a. Estamos aquí para orientarte.
          </p>
          <Link href="/auth">
            <Button
              size="lg"
              className="bg-white text-[var(--primary)] hover:bg-gray-100"
            >
              Comenzar ahora - Es gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-white font-bold text-xl mb-4">Neurosay</div>
              <p className="text-sm">
                Tecnología al servicio de la salud mental.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-white">Preguntas frecuentes</a></li>
                <li><a href="#" className="hover:text-white">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Términos de servicio</a></li>
                <li><a href="#" className="hover:text-white">Política de privacidad</a></li>
                <li><a href="#" className="hover:text-white">Tratamiento de datos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Emergencias</h4>
              <ul className="space-y-2 text-sm">
                <li>Colombia: <strong className="text-white">123</strong></li>
                <li>Salud Mental: <strong className="text-white">192 opción 4</strong></li>
                <li>Bogotá: <strong className="text-white">106</strong></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>© 2024 Neurosay. Todos los derechos reservados.</p>
            <p className="mt-2 text-xs">
              Este servicio no reemplaza la atención médica profesional.
              Si estás en crisis, busca ayuda inmediata.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
