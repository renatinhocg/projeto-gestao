import * as React from 'react'
import { Box, Typography, TextField, Button, Paper, CircularProgress, Card, CardContent, Chip, Grid, IconButton, Tooltip, Divider, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText } from '@mui/material'
import { Search01Icon, File02Icon, StarIcon, ViewIcon } from 'hugeicons-react'

export default function LawsuitSearch() {
    const [processNumber, setProcessNumber] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<any[]>([])
    const [searched, setSearched] = React.useState(false)
    const [favorites, setFavorites] = React.useState<any[]>([])
    const [detailsModalOpen, setDetailsModalOpen] = React.useState(false)
    const [selectedProcess, setSelectedProcess] = React.useState<any>(null)
    const [movements, setMovements] = React.useState<any[]>([])
    const [loadingMovements, setLoadingMovements] = React.useState(false)

    React.useEffect(() => {
        const savedFavorites = localStorage.getItem('lawsuit_favorites')
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites))
        }
    }, [])

    const toggleFavorite = async (process: any) => {
        const isFavorite = favorites.some(fav => fav.numeroProcesso === process.numeroProcesso)
        let newFavorites
        if (isFavorite) {
            newFavorites = favorites.filter(fav => fav.numeroProcesso !== process.numeroProcesso)
        } else {
            newFavorites = [...favorites, process]
            // Sync with backend monitoring
            try {
                const token = localStorage.getItem('token')
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
                await fetch(`${apiUrl}/api/lawsuits/monitor`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ cnj: process.numeroProcesso })
                })
            } catch (e) {
                console.error('Failed to create monitor:', e)
            }
        }
        setFavorites(newFavorites)
        localStorage.setItem('lawsuit_favorites', JSON.stringify(newFavorites))
    }

    const handleSearch = async () => {
        if (!processNumber.trim()) return
        setLoading(true)
        setSearched(true)
        setResults([]) // Clear previous results

        try {
            const token = localStorage.getItem('token')
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

            const response = await fetch(`${apiUrl}/api/lawsuits/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ processNumber })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao buscar processo')
            }

            const data = await response.json()
            setResults(data)
        } catch (error: any) {
            console.error('Search error:', error)
            setResults([])
            // Show error in UI (simple alert for now, or could add an error state)
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleViewDetails = async (process: any) => {
        setSelectedProcess(process)
        setDetailsModalOpen(true)
        setLoadingMovements(true)
        setMovements([])
        try {
            const token = localStorage.getItem('token')
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
            const res = await fetch(`${apiUrl}/api/lawsuits/${process.numeroProcesso}/movements`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setMovements(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingMovements(false)
        }
    }

    const renderProcessCard = (process: any, isResult = false) => {
        const isFavorite = favorites.some(fav => fav.numeroProcesso === process.numeroProcesso)
        return (
            <Card key={process.numeroProcesso} sx={{ mb: 2, borderRadius: '20px', boxShadow: '0px 3px 10px rgba(112, 144, 176, 0.08)', border: '1px solid transparent', '&:hover': { borderColor: '#4318FF' } }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#F4F7FE', color: '#4318FF' }}>
                                <File02Icon size={24} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2B3674' }}>
                                    {process.numeroProcesso}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {process.classe} • {process.tribunal}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {process.fonte && (
                                <Chip
                                    label={process.fonte}
                                    size="small"
                                    color={process.fonte === 'Escavador' ? 'warning' : 'default'}
                                    variant="outlined"
                                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                                />
                            )}
                            <Tooltip title={isFavorite ? "Remover dos favoritos" : "Monitorar processo"}>
                                <IconButton onClick={() => toggleFavorite(process)} sx={{ color: isFavorite ? '#FFB547' : '#A3AED0' }}>
                                    <StarIcon fill={isFavorite ? "currentColor" : "none"} />
                                </IconButton>
                            </Tooltip>
                            {isResult && <Chip label="Ativo" color="success" size="small" sx={{ borderRadius: '8px', fontWeight: 600 }} />}
                        </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            ASSUNTOS
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {process.assuntos.map((assunto: string, index: number) => (
                                <Chip key={index} label={assunto} sx={{ borderRadius: '8px', bgcolor: '#F4F7FE', color: '#2B3674', fontWeight: 500 }} />
                            ))}
                        </Box>
                    </Box>

                    <Box sx={{ p: 2, bgcolor: '#F4F7FE', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                ÚLTIMA MOVIMENTAÇÃO
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2B3674' }}>
                                {process.ultimaMovimentacao}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {new Date(process.dataUltimaMovimentacao).toLocaleString()}
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon size={16} />}
                            onClick={() => handleViewDetails(process)}
                            sx={{ borderRadius: '8px', textTransform: 'none', ml: 2, whiteSpace: 'nowrap' }}
                        >
                            Ver Detalhes
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        )
    }

    const [manualModalOpen, setManualModalOpen] = React.useState(false)
    const [manualData, setManualData] = React.useState({
        numeroProcesso: '',
        tribunal: '',
        classe: '',
        ultimaMovimentacao: ''
    })

    const handleManualSubmit = () => {
        const newProcess = {
            numeroProcesso: manualData.numeroProcesso || processNumber,
            classe: manualData.classe || 'Não informado',
            tribunal: manualData.tribunal || 'Manual',
            assuntos: ['Cadastro Manual'],
            ultimaMovimentacao: manualData.ultimaMovimentacao || 'Processo cadastrado manualmente',
            dataUltimaMovimentacao: new Date().toISOString()
        }

        // Add to results so it can be favorited
        setResults([newProcess])
        setManualModalOpen(false)

        // Auto-favorite it? Optional, but helpful.
        toggleFavorite(newProcess)
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: '#2B3674' }}>
                Consulta Processual
            </Typography>

            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '20px', border: '1px solid #E0E0E0' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <TextField
                            fullWidth
                            label="Número do Processo (CNJ)"
                            placeholder="Ex: 0000000-00.0000.0.00.0000"
                            value={processNumber}
                            onChange={(e) => setProcessNumber(e.target.value)}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: '12px' }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleSearch}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search01Icon />}
                            sx={{
                                height: '56px',
                                borderRadius: '12px',
                                bgcolor: '#4318FF',
                                textTransform: 'none',
                                fontSize: '1rem'
                            }}
                        >
                            {loading ? 'Buscando...' : 'Consultar Processo'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {searched && !loading && results.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary" sx={{ mb: 2 }}>Nenhum processo encontrado na base nacional.</Typography>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setManualData(prev => ({ ...prev, numeroProcesso: processNumber }))
                            setManualModalOpen(true)
                        }}
                        sx={{ borderRadius: '12px', textTransform: 'none' }}
                    >
                        Cadastrar Manualmente
                    </Button>
                </Box>
            )}

            {results.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#2B3674' }}>
                        Resultado da Busca
                    </Typography>
                    {results.map(process => renderProcessCard(process, true))}
                </Box>
            )}

            {favorites.length > 0 && (
                <Box>
                    <Divider sx={{ mb: 4 }} />
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#2B3674', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon color="#FFB547" fill="currentColor" /> Processos Monitorados
                    </Typography>
                    <Grid container spacing={2}>
                        {favorites.map(process => (
                            <Grid item xs={12} md={6} key={process.numeroProcesso}>
                                {renderProcessCard(process)}
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Manual Registration Modal */}
            {manualModalOpen && (
                <Paper sx={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '90%', maxWidth: 500, p: 4, borderRadius: '20px', zIndex: 9999,
                    boxShadow: '0px 20px 50px rgba(0,0,0,0.2)'
                }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Cadastrar Processo Manualmente</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Número do Processo" value={manualData.numeroProcesso} onChange={e => setManualData({ ...manualData, numeroProcesso: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Tribunal (ex: TRT1)" value={manualData.tribunal} onChange={e => setManualData({ ...manualData, tribunal: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Classe (ex: Reclamação)" value={manualData.classe} onChange={e => setManualData({ ...manualData, classe: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Última Movimentação" value={manualData.ultimaMovimentacao} onChange={e => setManualData({ ...manualData, ultimaMovimentacao: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                            <Button onClick={() => setManualModalOpen(false)}>Cancelar</Button>
                            <Button variant="contained" onClick={handleManualSubmit}>Salvar e Monitorar</Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}
            {/* Backdrop for modal */}
            {manualModalOpen && <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 9998 }} onClick={() => setManualModalOpen(false)} />}

            {/* Details Modal */}
            <Dialog open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: '#2B3674' }}>
                    Detalhes do Processo: {selectedProcess?.numeroProcesso}
                </DialogTitle>
                <DialogContent dividers>
                    {loadingMovements ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 3, fontSize: '16px', fontWeight: 700 }}>Linha do Tempo</Typography>
                            {movements.length > 0 ? (
                                <Box sx={{ position: 'relative', pl: 2, borderLeft: '2px solid #E0E5F2', ml: 1 }}>
                                    {movements.map((mov: any, index: number) => {
                                        const isHearing = mov.conteudo.toLowerCase().includes('audiência')
                                        return (
                                            <Box key={index} sx={{ mb: 4, position: 'relative', pl: 3 }}>
                                                {/* Dot */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    left: -9,
                                                    top: 0,
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '50%',
                                                    bgcolor: isHearing ? '#FFB547' : '#4318FF',
                                                    border: '3px solid white',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }} />

                                                {/* Date */}
                                                <Typography variant="caption" sx={{ color: '#A3AED0', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                    {new Date(mov.data).toLocaleDateString()} às {new Date(mov.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>

                                                {/* Content */}
                                                <Paper sx={{
                                                    p: 2,
                                                    borderRadius: '12px',
                                                    bgcolor: isHearing ? '#FFF8E1' : '#F4F7FE',
                                                    border: isHearing ? '1px solid #FFB547' : 'none',
                                                    boxShadow: 'none'
                                                }}>
                                                    {isHearing && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <Chip
                                                                label="Audiência"
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: '#FFB547',
                                                                    color: 'white',
                                                                    fontWeight: 700,
                                                                    height: 24
                                                                }}
                                                            />
                                                            {(() => {
                                                                const dateMatch = mov.conteudo.match(/(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}))?/)
                                                                const extractedDate = dateMatch ? `${dateMatch[1]} ${dateMatch[2] || ''}` : null
                                                                return extractedDate ? (
                                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#d35400', bgcolor: '#ffe0b2', px: 1, py: 0.5, borderRadius: '4px' }}>
                                                                        Data: {extractedDate}
                                                                    </Typography>
                                                                ) : null
                                                            })()}
                                                        </Box>
                                                    )}
                                                    <Typography variant="body2" sx={{ color: '#2B3674', fontWeight: 500 }}>
                                                        {mov.conteudo}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#A3AED0' }}>
                                                        Fonte: {mov.fonte?.nome || 'Tribunal'}
                                                    </Typography>
                                                </Paper>
                                            </Box>
                                        )
                                    })}
                                </Box>
                            ) : (
                                <Typography color="textSecondary">Nenhuma movimentação encontrada.</Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsModalOpen(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
