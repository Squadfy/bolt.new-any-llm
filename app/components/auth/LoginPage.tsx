import Login from './Login';

type LoginPageProps = {
  error: string;
};

const LoginPage = ({ error }: LoginPageProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="items-center justify-center flex-col p-8 shadow-md rounded-lg text-center flex flex-column">
        <img src="/squadfy-preto.png" alt="Squadfy" className="w-24 text-center pb-6" />
        <h1 className="text-xl font-semibold mb-6">
          Faça login com o seu email Squadfy
          <br />
          para usar a ferramenta Bolt
        </h1>
        <Login />
        {error !== '' && <p className="text-#dd3322 pt-4">{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
