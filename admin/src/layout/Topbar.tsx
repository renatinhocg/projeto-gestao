import * as React from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  InputBase,
  Avatar,
  Badge,
  Menu,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemIcon
} from '@mui/material'
import { useGetIdentity } from 'react-admin'
import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import InfoIcon from '@mui/icons-material/Info'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Topbar(props: any) {
  const { data: identity, isLoading } = useGetIdentity()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const open = Boolean(anchorEl)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.read).length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    }
  }

  // Poll for notifications every 30 seconds
  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseNotifications = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      try {
        const token = localStorage.getItem('token')
        await fetch(`${API_URL}/api/notifications/${notification.id}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        // Update local state
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleViewAll = () => {
    handleCloseNotifications()
    navigate('/notifications')
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <WarningIcon color="warning" fontSize="small" />
      case 'success': return <CheckCircleIcon color="success" fontSize="small" />
      case 'error': return <WarningIcon color="error" fontSize="small" />
      default: return <InfoIcon color="info" fontSize="small" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Agora'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        backdropFilter: 'blur(6px)',
        background: 'linear-gradient(180deg,#F6F8FF 0%,#F7F9FF 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}
      {...props}
    >
      <Toolbar sx={{
        display: 'flex',
        gap: 2,
        minHeight: 64,
        alignItems: 'center',
        px: 1,
        pt: 2,
        pb: 2,
        justifyContent: 'space-between'
      }}>
        <Box sx={{ flex: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              px: 2,
              py: 1,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              width: { xs: 200, sm: 280, md: 400 },
              boxShadow: '0px 6px 18px rgba(82,95,138,0.04)'
            }}
          >
            <SearchIcon color="action" />
            <InputBase placeholder="Search" sx={{ ml: 1, flex: 1 }} />
          </Box>

          <IconButton color="inherit" onClick={handleOpenNotifications}>
            <Badge badgeContent={unreadCount} color="error" variant="dot" invisible={unreadCount === 0}>
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseNotifications}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                width: 320,
                maxHeight: 400,
                overflowY: 'auto',
                borderRadius: '12px',
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2B3674' }}>
                Notificações
              </Typography>
              {unreadCount > 0 && (
                <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                  {unreadCount} novas
                </Typography>
              )}
            </Box>
            <Divider />
            <List sx={{ p: 0 }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Nenhuma notificação
                  </Typography>
                </Box>
              ) : (
                notifications.map((notification) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      alignItems="flex-start"
                      button
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        bgcolor: notification.read ? 'transparent' : 'rgba(67, 24, 255, 0.05)',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                        {getIcon(notification.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 400 : 700, color: '#2B3674' }}>
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                              {notification.description}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {formatTime(notification.createdAt)}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      {!notification.read && (
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1 }} />
                      )}
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Typography
                variant="caption"
                color="primary"
                sx={{ fontWeight: 600, cursor: 'pointer' }}
                onClick={handleViewAll}
              >
                Ver todas as notificações
              </Typography>
            </Box>
          </Menu>

          <IconButton color="inherit">
            <DarkModeIcon />
          </IconButton>
          <Avatar
            alt={identity?.fullName || 'User'}
            src={identity?.avatar || undefined}
            sx={{
              bgcolor: identity?.avatar ? 'transparent' : 'primary.main',
              cursor: 'pointer'
            }}
          >
            {!identity?.avatar && !isLoading && (identity?.fullName?.[0] || 'U')}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
