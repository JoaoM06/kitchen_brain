import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

const App = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Por favor, insira um e-mail válido.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    setTimeout(() => {
      setLoading(false);

      if (email.includes('fail')) {
         setMessage('Erro ao enviar link. Tente novamente ou verifique seu e-mail.');
         setMessageType('error');
      } else {
         setMessage(`Se o e-mail estiver registrado, o link de redefinição foi enviado para: ${email}`);
         setMessageType('success');
         setEmail('');
      }

    }, 2000);
  };

  const getMessageIcon = () => {
    if (messageType === 'success') {
      return <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />;
    } else if (messageType === 'error') {
      return <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 sm:p-10 border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
        
        {/* Header do Formulário */}
        <div className="flex flex-col items-center mb-8">
          {/* Ícone de Chave - Temático ao "Kitchen Brain" */}
          <div className="p-3 bg-emerald-500 rounded-full text-white mb-4 shadow-lg shadow-emerald-200">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            Esqueceu a Senha?
          </h1>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Não se preocupe! Insira seu e-mail abaixo e enviaremos um link para você criar uma nova.
          </p>
        </div>

        {/* Exibição de Mensagem (Sucesso/Erro/Carregando) */}
        {loading && (
          <div className="flex items-center justify-center p-3 mb-4 rounded-lg bg-emerald-50 text-emerald-600 font-medium">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Enviando...
          </div>
        )}

        {message && !loading && (
          <div className={`flex items-start p-4 mb-6 rounded-xl ${messageType === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} transition-opacity duration-300`}>
            {getMessageIcon()}
            <p className="text-sm font-medium leading-relaxed">{message}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* Campo de E-mail */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none transition duration-150 text-gray-700"
                placeholder="seu.email@exemplo.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white transition duration-200 ease-in-out transform
              ${loading
                ? 'bg-emerald-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 hover:-translate-y-0.5'
              }`}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              'Enviar Link de Redefinição'
            )}
          </button>
        </form>

        {/* Link para Login */}
        <div className="mt-8 text-center">
          <a
            href="/login"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500 flex items-center justify-center transition duration-150"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Lembrou? Voltar para o Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;