import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type BugReport = {
  id: number;
  title: string;
  description: string;
  priority: string;
  category: string;
  reporter_name: string;
  reporter_email: string;
  status: 'queue' | 'in_progress' | 'completed';
  created_at: string;
  attachments?: string[];
};

const AdminPanel = () => {
  const [reports, setReports] = useState<BugReport[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/bug-reports.php');
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        throw new Error('API unavailable');
      }
    } catch (error) {
      const localData = JSON.parse(localStorage.getItem('bug-reports') || '[]');
      setReports(localData);
    }
  };

  const updateStatus = async (id: number, newStatus: BugReport['status']) => {
    // Обновляем локальное состояние сразу для быстрого отклика UI
    const updated = reports.map(r => r.id === id ? { ...r, status: newStatus } : r);
    setReports(updated);
    localStorage.setItem('bug-reports', JSON.stringify(updated));

    try {
      await fetch(`/api/bug-reports.php?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error('Failed to update status on server:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };


  //отсюда
  const renderColumn = (status: BugReport['status'], title: string) => {
    const columnReports = reports.filter(r => r.status === status);
    
    return (
      <div className="flex-1 min-w-[320px]">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Badge variant="secondary">{columnReports.length}</Badge>
          </div>
          
          <div className="space-y-3">
            {columnReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {report.title}
                    </CardTitle>
                    {report.attachments && report.attachments.length > 0 && (
                      <Badge variant="outline" className="shrink-0">
                        📎 {report.attachments.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                <<p className="text-sm text-muted-foreground mb-3 overflow-hidden line-clamp-2 break-words">
  {report.description}
</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getPriorityColor(report.priority)}>
                      {report.priority}
                    </Badge>
                    {report.category && (
                      <Badge variant="outline">{report.category}</Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3">
                    <div>От: {report.reporter_name}</div>ф
                    <div>Email: {report.reporter_email}</div>
                    <div>Дата: {new Date(report.created_at).toLocaleDateString('ru-RU')}</div>
                  </div>

                  {report.attachments && report.attachments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium mb-1">Вложения:</p>
                      <div className="space-y-1">
                        {report.attachments.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline block truncate"
                          >
                            📎 Файл {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {status === 'queue' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(report.id, 'in_progress')}
                        className="flex-1"
                      >
                        В работу
                      </Button>
                    )}
                    {status === 'in_progress' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(report.id, 'queue')}
                          className="flex-1"
                        >
                          В очередь
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateStatus(report.id, 'completed')}
                          className="flex-1"
                        >
                          Завершить
                        </Button>
                      </>
                    )}
                    {status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(report.id, 'in_progress')}
                        className="flex-1"
                      >
                        Вернуть в работу
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {columnReports.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                Нет заявок
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };



            
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Админ-панель</h1>
            <p className="text-muted-foreground">
              Канбан-доска для отслеживания статуса заявок
            </p>
          </div>
          <Button onClick={() => navigate('/')}>
            Создать заявку
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {renderColumn('queue', 'В очереди')}
          {renderColumn('in_progress', 'В работе')}
          {renderColumn('completed', 'Выполнено')}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;




