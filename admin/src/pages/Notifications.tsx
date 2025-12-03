import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    IconButton,
    Chip,
    Button,
    Tabs,
    Tab,
    CircularProgress
} from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DoneAllIcon from '@mui/icons-material/DoneAll'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, unread

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setNotifications(data)
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const handleMarkAsRead = async (id: number) => {
        try {
            const token = localStorage.getItem('token')
            await fetch(`${API_URL}/api/notifications/${id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        } catch (e) {
            console.error(e)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <WarningIcon color="warning" />
            case 'success': return <CheckCircleIcon color="success" />
            case 'error': return <WarningIcon color="error" />
            default: return <InfoIcon color="info" />
        }
    }

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read
        return true
    })

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2B3674' }}>
                    Notificações
                </Typography>
                <Button
                    startIcon={<DoneAllIcon />}
                    onClick={() => notifications.forEach(n => !n.read && handleMarkAsRead(n.id))}
                    disabled={!notifications.some(n => !n.read)}
                >
                    Marcar todas como lidas
                </Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #E0E0E0', overflow: 'hidden' }}>
                <Tabs
                    value={filter}
                    onChange={(_, v) => setFilter(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
                >
                    <Tab label="Todas" value="all" />
                    <Tab label={`Não Lidas (${notifications.filter(n => !n.read).length})`} value="unread" />
                </Tabs>

                {loading ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {filteredNotifications.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="textSecondary">Nenhuma notificação encontrada.</Typography>
                            </Box>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <React.Fragment key={notification.id}>
                                    <ListItem
                                        alignItems="flex-start"
                                        sx={{
                                            bgcolor: notification.read ? 'transparent' : 'rgba(67, 24, 255, 0.03)',
                                            transition: '0.2s',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                                        }}
                                        secondaryAction={
                                            !notification.read && (
                                                <IconButton edge="end" onClick={() => handleMarkAsRead(notification.id)} title="Marcar como lida">
                                                    <CheckCircleIcon color="action" fontSize="small" />
                                                </IconButton>
                                            )
                                        }
                                    >
                                        <ListItemIcon sx={{ mt: 1 }}>
                                            {getIcon(notification.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: notification.read ? 400 : 700, color: '#2B3674' }}>
                                                        {notification.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {new Date(notification.createdAt).toLocaleString('pt-BR')}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary">
                                                    {notification.description}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))
                        )}
                    </List>
                )}
            </Paper>
        </Box>
    )
}
