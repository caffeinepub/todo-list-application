import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import TodoApp from './pages/TodoApp';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient();

export default function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TodoApp />
            <Toaster />
        </ThemeProvider>
    );
}
