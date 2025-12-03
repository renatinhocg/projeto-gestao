import * as React from 'react'
import {
    Card, CardContent, Typography, Box, Paper, Chip, Button, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
    FormControl, InputLabel, IconButton, ToggleButton, ToggleButtonGroup,
    Menu, ListItemIcon, ListItemText, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Tooltip, Avatar, CircularProgress
} from '@mui/material'

// ... (existing code)


import { Title, useGetList, useCreate, useUpdate, useDelete, useDataProvider } from 'react-admin'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import TaskDetailModal from '../components/TaskDetailModal'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useLocation, useNavigate } from 'react-router-dom'

interface Task {
    id: number
    title: string
    description: string
    status: string // Deprecated, use columnId
    columnId?: string
    priority: string
    dueDate?: string
    assignees?: any[]
    subtasks?: any[]
    attachments?: any[]
    comments?: any[]
    createdAt?: string
    updatedAt?: string
    projectId?: number
}

interface Column {
    id: string
    title: string
    order: number
    projectId?: number
}

export default function Kanban() {
    const location = useLocation()
    const navigate = useNavigate()
    const searchParams = new URLSearchParams(location.search)
    const projectId = searchParams.get('projectId')

    // Manual fetching to prevent infinite loops with useGetList
    const [tasks, setTasks] = React.useState<Task[]>([])
    const [columnsData, setColumnsData] = React.useState<Column[]>([])
    const [isLoadingTasks, setIsLoadingTasks] = React.useState(true)
    const [isLoadingColumns, setIsLoadingColumns] = React.useState(true)
    const dataProvider = useDataProvider()

    const fetchTasks = React.useCallback(async () => {
        // setIsLoadingTasks(true) // Optional: don't show loading on refetch to avoid flicker
        try {
            const { data } = await dataProvider.getList('tasks', {
                pagination: { page: 1, perPage: 100 },
                sort: { field: 'createdAt', order: 'DESC' },
                filter: projectId ? { projectId } : {}
            })
            setTasks(data)
            setLocalTasks(data)
        } catch (error) {
            console.error('Failed to fetch tasks:', error)
        } finally {
            setIsLoadingTasks(false)
        }
    }, [dataProvider, projectId])

    const fetchColumns = React.useCallback(async () => {
        // setIsLoadingColumns(true)
        try {
            const { data } = await dataProvider.getList('columns', {
                pagination: { page: 1, perPage: 100 },
                sort: { field: 'order', order: 'ASC' },
                filter: projectId ? { projectId } : {}
            })
            setColumnsData(data)
            setLocalColumns(data)
        } catch (error) {
            console.error('Failed to fetch columns:', error)
        } finally {
            setIsLoadingColumns(false)
        }
    }, [dataProvider, projectId])

    React.useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    React.useEffect(() => {
        fetchColumns()
    }, [fetchColumns])

    // Aliases for compatibility
    const refetchTasks = fetchTasks
    const refetchColumns = fetchColumns

    // Fetch Project Details (optional, for title)
    const [projectName, setProjectName] = React.useState('')
    React.useEffect(() => {
        if (projectId) {
            const fetchProject = async () => {
                try {
                    const token = localStorage.getItem('token')
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/projects/${projectId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setProjectName(data.name)
                    }
                } catch (e) { console.error(e) }
            }
            fetchProject()
        }
    }, [projectId])

    const [create] = useCreate()
    const [update] = useUpdate()
    const [deleteOne] = useDelete()
    // dataProvider already defined above

    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
    const [modalOpen, setModalOpen] = React.useState(false)

    // View Mode
    const [viewMode, setViewMode] = React.useState<'board' | 'list'>('board')

    // Create Task Dialog
    const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
    const [newTaskTitle, setNewTaskTitle] = React.useState('')
    const [newTaskColumnId, setNewTaskColumnId] = React.useState('')

    // Column Management
    const [createColumnDialogOpen, setCreateColumnDialogOpen] = React.useState(false)
    const [newColumnTitle, setNewColumnTitle] = React.useState('')
    const [editingColumn, setEditingColumn] = React.useState<Column | null>(null)
    const [editColumnDialogOpen, setEditColumnDialogOpen] = React.useState(false)
    const [editColumnTitle, setEditColumnTitle] = React.useState('')
    const [columnMenuAnchor, setColumnMenuAnchor] = React.useState<null | HTMLElement>(null)
    const [activeColumnMenuId, setActiveColumnMenuId] = React.useState<string | null>(null)

    const [localTasks, setLocalTasks] = React.useState<Task[]>([])
    const [localColumns, setLocalColumns] = React.useState<Column[]>([])



    const handleDragEnd = async (result: any) => {
        if (!result.destination) return

        const taskId = parseInt(result.draggableId)
        const newColumnId = result.destination.droppableId
        const oldColumnId = result.source.droppableId

        if (newColumnId === oldColumnId) return

        // Optimistic update
        const updatedTasks = localTasks.map(t =>
            t.id === taskId ? { ...t, columnId: newColumnId, status: localColumns.find(c => c.id === newColumnId)?.title || t.status } : t
        )
        setLocalTasks(updatedTasks)

        try {
            await update('tasks', {
                id: taskId,
                data: { columnId: newColumnId },
                previousData: tasks?.find((t: Task) => t.id === taskId)
            })
        } catch (error) {
            console.error('Failed to update task column:', error)
            setLocalTasks(tasks || [])
        }
    }

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim()) return

        try {
            await create('tasks', {
                data: {
                    title: newTaskTitle,
                    columnId: newTaskColumnId || localColumns[0]?.id,
                    status: 'todo', // Fallback
                    priority: 'medium',
                    projectId: projectId ? parseInt(projectId) : null
                }
            })
            setCreateDialogOpen(false)
            setNewTaskTitle('')
            refetchTasks()
        } catch (error) {
            console.error('Failed to create task:', error)
        }
    }

    const handleCreateColumn = async () => {
        if (!newColumnTitle.trim()) return

        // Optimistic update
        const tempId = `temp-${Date.now()}`
        const newColumn: Column = {
            id: tempId,
            title: newColumnTitle,
            order: localColumns.length,
            projectId: projectId ? parseInt(projectId) : undefined
        }
        setLocalColumns([...localColumns, newColumn])
        setCreateColumnDialogOpen(false)
        setNewColumnTitle('')

        try {
            console.log('Sending create request for column:', newColumnTitle)
            const response = await dataProvider.create('columns', {
                data: {
                    title: newColumnTitle,
                    order: localColumns.length,
                    projectId: projectId ? parseInt(projectId) : null
                }
            })
            console.log('Server response:', response)
            const createdColumn = response.data

            // Replace temp column with real column from server
            setLocalColumns(prev => {
                console.log('Updating local columns. Prev:', prev)
                const updated = prev.map(c => c.id === tempId ? createdColumn : c)
                console.log('Updated columns:', updated)
                return updated
            })
            // No need to refetch immediately, we have the data
        } catch (error) {
            console.error('Failed to create column:', error)
            // Remove temp column on failure
            setLocalColumns(prev => prev.filter(c => c.id !== tempId))
            alert('Erro ao criar coluna')
        }
    }

    const handleEditColumn = async () => {
        if (!editingColumn || !editColumnTitle.trim()) return
        try {
            await update('columns', {
                id: editingColumn.id,
                data: { title: editColumnTitle },
                previousData: editingColumn
            })
            setEditColumnDialogOpen(false)
            setEditingColumn(null)
            refetchColumns()
        } catch (error) {
            console.error('Failed to update column:', error)
        }
    }

    const handleDeleteColumn = async (columnId?: string) => {
        const idToDelete = columnId || editingColumn?.id
        if (!idToDelete) return
        if (!confirm('Tem certeza? As tarefas nesta coluna ficarão ocultas ou precisarão ser reatribuídas.')) return
        // Optimistic update
        setLocalColumns(prev => prev.filter(c => c.id !== idToDelete))
        setEditColumnDialogOpen(false)
        setEditingColumn(null)

        try {
            await deleteOne('columns', { id: idToDelete })
            // No need to refetch if successful
        } catch (error) {
            console.error('Failed to delete column:', error)
            // Revert if failed (would need to fetch or keep a backup, but simple refetch is easier fallback)
            refetchColumns()
            alert('Erro ao excluir coluna')
        }
    }

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

        try {
            await deleteOne('tasks', {
                id: taskId,
                previousData: tasks?.find((t: Task) => t.id === taskId)
            })
            refetchTasks()
        } catch (error) {
            console.error('Failed to delete task:', error)
        }
    }

    const handleSaveTask = async (updatedTask: Task) => {
        try {
            const originalTask = tasks?.find((t: Task) => t.id === updatedTask.id)

            // 1. Save main task data
            await update('tasks', {
                id: updatedTask.id,
                data: {
                    title: updatedTask.title,
                    description: updatedTask.description,
                    columnId: updatedTask.columnId,
                    status: updatedTask.status,
                    priority: updatedTask.priority,
                    dueDate: updatedTask.dueDate,
                    assigneeIds: updatedTask.assignees?.map((a: any) => a.id) // Save assignees
                },
                previousData: originalTask
            })

            // 2. Handle Subtasks (Create, Update, Delete)
            const originalSubtasks = originalTask?.subtasks || []
            const currentSubtasks = updatedTask.subtasks || []

            // Identify deleted subtasks
            const subtasksToDelete = originalSubtasks.filter(
                (os: any) => !currentSubtasks.find((cs: any) => cs.id === os.id)
            )
            for (const subtask of subtasksToDelete) {
                await dataProvider.delete('subtasks', {
                    id: subtask.id,
                    meta: { endpoint: `/subtasks/${subtask.id}` }
                })
            }

            // Create or Update subtasks
            for (const subtask of currentSubtasks) {
                if (subtask.id.toString().startsWith('temp-')) {
                    await dataProvider.create('tasks', {
                        data: { title: subtask.title },
                        meta: { endpoint: `/tasks/${updatedTask.id}/subtasks` }
                    })
                } else {
                    const original = originalSubtasks.find((os: any) => os.id === subtask.id)
                    if (original && (original.title !== subtask.title || original.completed !== subtask.completed)) {
                        await dataProvider.update('subtasks', {
                            id: subtask.id,
                            data: { title: subtask.title, completed: subtask.completed },
                            previousData: subtask,
                            meta: { endpoint: `/subtasks/${subtask.id}` }
                        })
                    }
                }
            }

            // 3. Handle Attachments (Create, Delete)
            const originalAttachments = originalTask?.attachments || []
            const currentAttachments = updatedTask.attachments || []

            // Identify deleted attachments
            const attachmentsToDelete = originalAttachments.filter(
                (oa: any) => !currentAttachments.find((ca: any) => ca.id === oa.id)
            )
            for (const attachment of attachmentsToDelete) {
                await dataProvider.delete('attachments', {
                    id: attachment.id,
                    meta: { endpoint: `/attachments/${attachment.id}` }
                })
            }

            // Create new attachments
            const newAttachments = currentAttachments.filter((a: any) => a.id.toString().startsWith('temp-'))
            for (const attachment of newAttachments) {
                await dataProvider.create('tasks', {
                    data: {
                        name: attachment.name,
                        size: attachment.size,
                        url: `https://example.com/${attachment.name}` // Mock URL
                    },
                    meta: { endpoint: `/tasks/${updatedTask.id}/attachments` }
                })
            }

            // 4. Handle Comments (Create only)
            if (updatedTask.comments) {
                const newComments = updatedTask.comments.filter((c: any) =>
                    c.id.toString().startsWith('temp-')
                )
                for (const comment of newComments) {
                    await dataProvider.create('tasks', {
                        data: { content: comment.content },
                        meta: { endpoint: `/tasks/${updatedTask.id}/comments` }
                    })
                }
            }

            setModalOpen(false)
            refetchTasks()
        } catch (error) {
            console.error('Failed to save task:', error)
        }
    }

    const getTasksByColumn = (columnId: string) => {
        return localTasks.filter((task: Task) => {
            // 1. Check direct columnId match (new tasks)
            if (task.columnId === columnId) return true

            // 2. Backward compatibility for old tasks with no columnId
            if (!task.columnId && task.status) {
                const column = localColumns.find(c => c.id === columnId)
                if (!column) return false

                const status = task.status.toLowerCase().replace('_', ' ').trim()
                const columnTitle = column.title.toLowerCase().trim()

                // Direct match or "contains" check
                if (columnTitle === status) return true
                if (columnTitle.includes(status)) return true

                // Specific mappings for common defaults
                if (status === 'todo' && columnTitle === 'to do') return true
                if (status === 'in progress' && columnTitle === 'in progress') return true
                if (status === 'done' && columnTitle === 'done') return true
            }

            return false
        })
    }

    // Fetch Assignees
    const { data: assigneesData } = useGetList('assignees', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'name', order: 'ASC' }
    })

    if (isLoadingTasks || isLoadingColumns) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
            <CircularProgress />
        </Box>
    )

    return (
        <Box sx={{ p: 3, pt: 0, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {projectId && (
                        <IconButton onClick={() => navigate('/projects')}>
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2B3674', minWidth: '200px' }}>
                        {projectName ? `Projeto: ${projectName}` : 'Quadro Kanban'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newView) => { if (newView) setViewMode(newView) }}
                        size="small"
                        sx={{ bgcolor: 'white', borderRadius: '10px' }}
                    >
                        <ToggleButton value="board"><ViewModuleIcon /></ToggleButton>
                        <ToggleButton value="list"><ViewListIcon /></ToggleButton>
                    </ToggleButtonGroup>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                        sx={{
                            bgcolor: '#4318FF',
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: '0px 4px 10px rgba(67, 24, 255, 0.24)'
                        }}
                    >
                        Nova Tarefa
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateColumnDialogOpen(true)}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                    >
                        Nova Coluna
                    </Button>
                </Box>
            </Box>

            {/* Board View */}
            {viewMode === 'board' && (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'scroll', // Force scrollbar track to be visible
                        pb: 3, // Increase padding to accommodate scrollbar
                        px: 2, // Add horizontal padding inside the scroll container
                        flex: 1,
                        flexWrap: 'nowrap',
                        alignItems: 'flex-start',
                        minHeight: 0,
                        width: '100%',
                        maxWidth: '100%',
                        mb: 2,
                        scrollSnapType: { xs: 'x mandatory', md: 'none' },
                        '&::-webkit-scrollbar': { height: '12px' },
                        '&::-webkit-scrollbar-track': { background: '#e0e0e0', borderRadius: '6px' },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#888',
                            borderRadius: '6px',
                            border: '3px solid #e0e0e0'
                        },
                        '&::-webkit-scrollbar-thumb:hover': { background: '#555' }
                    }}>
                        {localColumns.map((column) => (
                            <Droppable key={column.id} droppableId={column.id}>
                                {(provided) => (
                                    <Paper
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        sx={{
                                            minWidth: { xs: '85vw', sm: '320px', md: 260 },
                                            width: { xs: '85vw', sm: '320px', md: 260 },
                                            flexShrink: 0,
                                            scrollSnapAlign: 'center',
                                            bgcolor: '#F4F7FE',
                                            p: 2,
                                            borderRadius: '20px',
                                            maxHeight: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            border: '2px solid rgba(108, 92, 231, 0.1)',
                                            boxShadow: '0px 4px 20px rgba(112, 144, 176, 0.15)',
                                            '&:hover': {
                                                boxShadow: '0px 8px 30px rgba(112, 144, 176, 0.25)',
                                                borderColor: 'rgba(108, 92, 231, 0.2)'
                                            }
                                        }}
                                        elevation={0}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2B3674' }}>
                                                {column.title}
                                                <Chip
                                                    label={getTasksByColumn(column.id).length}
                                                    size="small"
                                                    sx={{ ml: 1, bgcolor: 'white', fontWeight: 'bold' }}
                                                />
                                            </Typography>
                                            <IconButton size="small" onClick={(e) => {
                                                setColumnMenuAnchor(e.currentTarget)
                                                setActiveColumnMenuId(column.id)
                                                setEditingColumn(column)
                                                setEditColumnTitle(column.title)
                                            }}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>

                                            {getTasksByColumn(column.id).map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                    {(provided) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => {
                                                                setSelectedTask(task)
                                                                setModalOpen(true)
                                                            }}
                                                            sx={{
                                                                mb: 2,
                                                                borderRadius: '20px',
                                                                boxShadow: '0px 3px 10px rgba(112, 144, 176, 0.08)',
                                                                cursor: 'pointer',
                                                                border: '1px solid transparent',
                                                                '&:hover': {
                                                                    boxShadow: '0px 8px 20px rgba(112, 144, 176, 0.12)',
                                                                    transform: 'translateY(-2px)',
                                                                    transition: 'all 0.2s',
                                                                    borderColor: '#4318FF'
                                                                }
                                                            }}
                                                        >
                                                            <CardContent sx={{ p: '20px !important' }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1B2559', fontSize: '16px' }}>
                                                                        {task.title}
                                                                    </Typography>
                                                                    <IconButton size="small" sx={{ mt: -1, mr: -1 }}>
                                                                        <EditIcon fontSize="small" sx={{ color: '#A3AED0' }} />
                                                                    </IconButton>
                                                                </Box>

                                                                {task.description && (
                                                                    <Typography variant="body2" sx={{ color: '#A3AED0', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                        {task.description}
                                                                    </Typography>
                                                                )}

                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                                    <Chip
                                                                        label={task.priority}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: task.priority === 'high' ? '#FFECEC' : task.priority === 'medium' ? '#FFF7E6' : '#E6F7FF',
                                                                            color: task.priority === 'high' ? '#FF5656' : task.priority === 'medium' ? '#FFB547' : '#00A3FF',
                                                                            fontWeight: 700,
                                                                            borderRadius: '8px',
                                                                            textTransform: 'capitalize',
                                                                            border: 'none'
                                                                        }}
                                                                    />

                                                                    {task.assignees && task.assignees.length > 0 ? (
                                                                        <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
                                                                            {task.assignees.map((assignee: any, i: number) => (
                                                                                <Tooltip key={assignee.id} title={assignee.name}>
                                                                                    <Avatar
                                                                                        src={assignee.photoUrl}
                                                                                        sx={{
                                                                                            width: 28,
                                                                                            height: 28,
                                                                                            border: '2px solid white',
                                                                                            ml: -1,
                                                                                            fontSize: '12px',
                                                                                            bgcolor: '#4318FF'
                                                                                        }}
                                                                                    >
                                                                                        {assignee.name?.[0]}
                                                                                    </Avatar>
                                                                                </Tooltip>
                                                                            ))}
                                                                        </Box>
                                                                    ) : (
                                                                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: '1px dashed #A3AED0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <AddIcon sx={{ fontSize: 16, color: '#A3AED0' }} />
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </Box>
                                    </Paper>
                                )}
                            </Droppable>
                        ))}
                    </Box>
                </DragDropContext>
            )}

            {/* List View */}
            {
                viewMode === 'list' && (
                    <TableContainer component={Paper} sx={{ borderRadius: '20px', boxShadow: '0px 18px 40px rgba(112, 144, 176, 0.12)' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Título</TableCell>
                                    <TableCell>Coluna</TableCell>
                                    <TableCell>Prioridade</TableCell>
                                    <TableCell>Responsáveis</TableCell>
                                    <TableCell>Data de Entrega</TableCell>
                                    <TableCell>Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {localTasks.map((task) => (
                                    <TableRow key={task.id} hover onClick={() => { setSelectedTask(task); setModalOpen(true) }} sx={{ cursor: 'pointer' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>{task.title}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={localColumns.find(c => c.id === task.columnId)?.title || task.status}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={task.priority}
                                                size="small"
                                                color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'success'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex' }}>
                                                {task.assignees?.map((a: any) => (
                                                    <Box
                                                        key={a.id}
                                                        component="img"
                                                        src={a.photoUrl || 'https://via.placeholder.com/30'}
                                                        sx={{ width: 24, height: 24, borderRadius: '50%', ml: -1, border: '2px solid white' }}
                                                    />
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteOne('tasks', { id: task.id }) }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            }

            {/* Task Detail Modal */}
            <TaskDetailModal
                open={modalOpen}
                task={selectedTask}
                columns={localColumns}
                assignees={assigneesData || []}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveTask}
                onDelete={() => {
                    if (selectedTask) {
                        deleteOne('tasks', { id: selectedTask.id })
                        setModalOpen(false)
                        refetchTasks()
                    }
                }}
            />

            {/* Create Task Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
                <DialogTitle>Nova Tarefa</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Título da Tarefa"
                        fullWidth
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Coluna</InputLabel>
                        <Select
                            value={newTaskColumnId}
                            label="Coluna"
                            onChange={(e) => setNewTaskColumnId(e.target.value)}
                        >
                            {localColumns.map((col) => (
                                <MenuItem key={col.id} value={col.id}>{col.title}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateTask} variant="contained">Criar</Button>
                </DialogActions>
            </Dialog>

            {/* Create Column Dialog */}
            <Dialog open={createColumnDialogOpen} onClose={() => setCreateColumnDialogOpen(false)}>
                <DialogTitle>Nova Coluna</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Título da Coluna"
                        fullWidth
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateColumnDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateColumn} variant="contained">Criar</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Column Dialog */}
            <Dialog open={editColumnDialogOpen} onClose={() => setEditColumnDialogOpen(false)}>
                <DialogTitle>Editar Coluna</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Título da Coluna"
                        fullWidth
                        value={editColumnTitle}
                        onChange={(e) => setEditColumnTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleDeleteColumn(editingColumn?.id!)} color="error">Excluir</Button>
                    <Button onClick={() => setEditColumnDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleEditColumn} variant="contained">Salvar</Button>
                </DialogActions>
            </Dialog>

            {/* Column Menu */}
            <Menu
                anchorEl={columnMenuAnchor}
                open={Boolean(columnMenuAnchor)}
                onClose={() => setColumnMenuAnchor(null)}
            >
                <MenuItem onClick={() => {
                    setEditColumnDialogOpen(true)
                    setColumnMenuAnchor(null)
                }}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Editar Coluna</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                    if (activeColumnMenuId) handleDeleteColumn(activeColumnMenuId)
                    setColumnMenuAnchor(null)
                }}>
                    <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Excluir Coluna</ListItemText>
                </MenuItem>
            </Menu>
        </Box >
    )
}
