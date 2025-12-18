import { useState } from 'react';
import { CheckCircle2, Circle, Calendar, Trash2, Edit2, Plus, ListTodo, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllTasks, useAddTask, useUpdateTask, useDeleteTask, useToggleTask } from '../hooks/useQueries';
import type { Task } from '../backend';
import { toast } from 'sonner';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

type FilterType = 'all' | 'active' | 'completed';

export default function TodoApp() {
    const [filter, setFilter] = useState<FilterType>('all');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDueDate, setEditDueDate] = useState('');

    const { data: tasks = [], isLoading } = useGetAllTasks();
    const addTaskMutation = useAddTask();
    const updateTaskMutation = useUpdateTask();
    const deleteTaskMutation = useDeleteTask();
    const toggleTaskMutation = useToggleTask();

    const filteredTasks = tasks.filter((task) => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) {
            toast.error('Please enter a task title');
            return;
        }

        const dueDate = newTaskDueDate ? BigInt(new Date(newTaskDueDate).getTime() * 1_000_000) : null;

        addTaskMutation.mutate(
            { title: newTaskTitle.trim(), dueDate },
            {
                onSuccess: () => {
                    setNewTaskTitle('');
                    setNewTaskDueDate('');
                    toast.success('Task added successfully');
                },
                onError: () => {
                    toast.error('Failed to add task');
                }
            }
        );
    };

    const handleToggleTask = (task: Task) => {
        toggleTaskMutation.mutate(task.id, {
            onSuccess: () => {
                toast.success(task.completed ? 'Task marked as active' : 'Task completed!');
            },
            onError: () => {
                toast.error('Failed to update task');
            }
        });
    };

    const handleDeleteTask = (id: number) => {
        deleteTaskMutation.mutate(id, {
            onSuccess: () => {
                toast.success('Task deleted');
            },
            onError: () => {
                toast.error('Failed to delete task');
            }
        });
    };

    const openEditDialog = (task: Task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditDueDate(task.dueDate ? format(new Date(Number(task.dueDate) / 1_000_000), 'yyyy-MM-dd') : '');
    };

    const handleUpdateTask = () => {
        if (!editingTask || !editTitle.trim()) {
            toast.error('Please enter a task title');
            return;
        }

        const dueDate = editDueDate ? BigInt(new Date(editDueDate).getTime() * 1_000_000) : null;

        updateTaskMutation.mutate(
            {
                id: editingTask.id,
                title: editTitle.trim(),
                dueDate,
                completed: editingTask.completed
            },
            {
                onSuccess: () => {
                    setEditingTask(null);
                    setEditTitle('');
                    setEditDueDate('');
                    toast.success('Task updated successfully');
                },
                onError: () => {
                    toast.error('Failed to update task');
                }
            }
        );
    };

    const getDueDateInfo = (dueDate?: bigint) => {
        if (!dueDate) return null;

        const date = new Date(Number(dueDate) / 1_000_000);
        const isOverdue = isPast(date) && !isToday(date);

        let label = format(date, 'MMM d, yyyy');
        if (isToday(date)) label = 'Today';
        else if (isTomorrow(date)) label = 'Tomorrow';

        return { date, label, isOverdue };
    };

    const activeCount = tasks.filter((t) => !t.completed).length;
    const completedCount = tasks.filter((t) => t.completed).length;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <ListTodo className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Todo List</h1>
                            <p className="text-sm text-muted-foreground">Stay organized and productive</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                {/* Add Task Section */}
                <Card className="p-6 mb-8 shadow-lg border-primary/20">
                    <h2 className="text-lg font-semibold mb-4">Add New Task</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            placeholder="What needs to be done?"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            className="flex-1"
                        />
                        <Input
                            type="date"
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className="sm:w-48"
                        />
                        <Button
                            onClick={handleAddTask}
                            disabled={addTaskMutation.isPending}
                            className="sm:w-auto"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                        </Button>
                    </div>
                </Card>

                {/* Filter Tabs */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                        <TabsList>
                            <TabsTrigger value="all">
                                All <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="active">
                                Active <Badge variant="secondary" className="ml-2">{activeCount}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="completed">
                                Completed <Badge variant="secondary" className="ml-2">{completedCount}</Badge>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="p-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-6 w-6 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/4" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </>
                    ) : filteredTasks.length === 0 ? (
                        <Card className="p-12 text-center">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                <ListTodo className="h-12 w-12 opacity-50" />
                                <p className="text-lg font-medium">No tasks found</p>
                                <p className="text-sm">
                                    {filter === 'active' && 'All tasks are completed!'}
                                    {filter === 'completed' && 'No completed tasks yet'}
                                    {filter === 'all' && 'Add your first task to get started'}
                                </p>
                            </div>
                        </Card>
                    ) : (
                        filteredTasks.map((task) => {
                            const dueDateInfo = getDueDateInfo(task.dueDate);
                            return (
                                <Card
                                    key={task.id}
                                    className={`p-4 transition-all hover:shadow-md ${
                                        task.completed ? 'bg-muted/30' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <button
                                            onClick={() => handleToggleTask(task)}
                                            disabled={toggleTaskMutation.isPending}
                                            className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
                                        >
                                            {task.completed ? (
                                                <CheckCircle2 className="h-6 w-6 text-primary" />
                                            ) : (
                                                <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-base font-medium break-words ${
                                                    task.completed
                                                        ? 'line-through text-muted-foreground'
                                                        : 'text-foreground'
                                                }`}
                                            >
                                                {task.title}
                                            </p>
                                            {dueDateInfo && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span
                                                        className={`text-sm ${
                                                            dueDateInfo.isOverdue && !task.completed
                                                                ? 'text-destructive font-medium'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {dueDateInfo.label}
                                                        {dueDateInfo.isOverdue && !task.completed && ' (Overdue)'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(task)}
                                                disabled={updateTaskMutation.isPending}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteTask(task.id)}
                                                disabled={deleteTaskMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-background/80 backdrop-blur-sm mt-12">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    <p className="flex items-center justify-center gap-1.5">
                        © 2025. Built with <Heart className="h-4 w-4 text-destructive fill-destructive" /> using{' '}
                        <a
                            href="https://caffeine.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-foreground transition-colors underline"
                        >
                            caffeine.ai
                        </a>
                    </p>
                </div>
            </footer>

            {/* Edit Dialog */}
            <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Task Title</Label>
                            <Input
                                id="edit-title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Task title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-due-date">Due Date (Optional)</Label>
                            <Input
                                id="edit-due-date"
                                type="date"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTask(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateTask} disabled={updateTaskMutation.isPending}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
