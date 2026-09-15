import AppLayout from "./components/layout/AppLayout.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRouter from "./routes/AppRouter.jsx";

export default function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <AppRouter />
      </AppLayout>
    </AuthProvider>
  );
}
