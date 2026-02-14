export type UserRole = 'civilian' | 'volunteer' | 'rescue-team' | null;

export type IncidentType = 'fire' | 'flood' | 'earthquake' | 'medical' | 'other';

export type TaskStatus = 'urgent' | 'in-progress' | 'completed';

export type MarkerType = 'fire' | 'flood' | 'shelter' | 'hospital' | 'sos';

export interface Incident {
  id: string;
  type: IncidentType;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  reportedBy: string;
  timestamp: Date;
  image?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  status: TaskStatus;
  assignedTo?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MapMarker {
  id: string;
  type: MarkerType;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  description: string;
  capacity?: number;
  available?: boolean;
}

export interface SOSAlert {
  id: string;
  victimName: string;
  age: number;
  condition: string;
  location: string;
  coordinates: { lat: number; lng: number };
  timestamp: Date;
  status: 'pending' | 'assigned' | 'rescued';
  urgency: 'critical' | 'high' | 'medium';
}
