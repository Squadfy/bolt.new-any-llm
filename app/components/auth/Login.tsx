import { auth, provider, signInWithPopup } from '~/firebaseConfig';

const Login = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Succesful login', result.user);
    } catch (error) {
      console.log(`Erro ao fazer login: ${error}`);
    }
  };

  return (
    <div>
      <button
        onClick={handleLogin}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Login with Google
      </button>
    </div>
  );
};

export default Login;
