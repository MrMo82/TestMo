# Deployment zu Vercel und Supabase-Integration

Diese Anleitung führt dich Schritt für Schritt durch das Deployment deiner TestMo-App zu Vercel und die Integration mit Supabase.

## 📋 Voraussetzungen

- GitHub-Account
- Vercel-Account (https://vercel.com)
- Supabase-Account (https://supabase.com)
- Git installiert

## 🚀 Teil 1: Deployment zu Vercel

### Schritt 1: Code zu GitHub pushen

```bash
# Falls noch nicht initialisiert
git init
git add .
git commit -m "Prepare for Vercel deployment"

# Mit deinem GitHub-Repository verbinden und pushen
git remote add origin https://github.com/MrMo82/TestMo.git
git branch -M main
git push -u origin main
```

### Schritt 2: Projekt mit Vercel verbinden

1. Gehe zu https://vercel.com/marcels-projects-50d57c36
2. Klicke auf "Add New..." → "Project"
3. Importiere dein GitHub-Repository `MrMo82/TestMo`
4. Vercel erkennt automatisch Vite als Framework

### Schritt 3: Environment-Variablen in Vercel konfigurieren

1. Gehe in den Project Settings → Environment Variables
2. Füge folgende Variable hinzu:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: Dein Gemini API Key
   - **Environment**: Production, Preview, Development (alle auswählen)

### Schritt 4: Deployment starten

1. Klicke auf "Deploy"
2. Vercel baut und deployed deine App automatisch
3. Nach ~2 Minuten ist deine App live!

## 🗄️ Teil 2: Supabase einrichten

### Schritt 1: Neues Supabase-Projekt erstellen

1. Gehe zu https://supabase.com/dashboard
2. Klicke auf "New Project"
3. Wähle einen Projektnamen (z.B. "testmo")
4. Wähle eine Region (z.B. "Europe (Frankfurt)")
5. Setze ein sicheres Datenbankpasswort
6. Klicke auf "Create new project"

### Schritt 2: API-Credentials kopieren

1. Gehe zu Project Settings → API
2. Kopiere:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **anon/public** Key

### Schritt 3: Environment-Variablen zu Vercel hinzufügen

1. Zurück zu Vercel → Project Settings → Environment Variables
2. Füge hinzu:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Deine Project URL
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Dein anon Key

### Schritt 4: Datenbank-Schema erstellen

Gehe zum SQL Editor in Supabase und führe folgendes SQL aus:

```sql
-- Tabelle für Testfälle
CREATE TABLE test_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  steps JSONB,
  expected_result TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT CHECK (status IN ('draft', 'active', 'deprecated')),
  project_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  tags TEXT[]
);

-- Tabelle für Testausführungen
CREATE TABLE test_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('passed', 'failed', 'blocked', 'skipped')),
  executed_by UUID REFERENCES auth.users(id),
  execution_time INTEGER,
  notes TEXT,
  attachments JSONB
);

-- Tabelle für Projekte
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  settings JSONB
);

-- Tabelle für Defects/Bugs
CREATE TABLE defects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  test_execution_id UUID REFERENCES test_executions(id),
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id)
);

-- Row Level Security (RLS) aktivieren
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;

-- Policies für test_cases
CREATE POLICY "Authenticated users can view test cases" 
  ON test_cases FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create test cases" 
  ON test_cases FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own test cases" 
  ON test_cases FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = created_by);

-- Policies für test_executions
CREATE POLICY "Authenticated users can view executions" 
  ON test_executions FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create executions" 
  ON test_executions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = executed_by);

-- Policies für projects
CREATE POLICY "Authenticated users can view projects" 
  ON projects FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create projects" 
  ON projects FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = created_by);

-- Policies für defects
CREATE POLICY "Authenticated users can view defects" 
  ON defects FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create defects" 
  ON defects FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = reported_by);

-- Automatisches Update von updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON test_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Schritt 5: Authentifizierung einrichten

1. Gehe zu Authentication → Providers in Supabase
2. Email Auth ist standardmäßig aktiviert
3. Optional: Aktiviere zusätzliche Provider (Google, GitHub, etc.)

### Schritt 6: Re-deploy auf Vercel

```bash
# Lokale .env erstellen (nur für Entwicklung)
cp .env.example .env
# Füge deine Keys in .env ein

# Dependencies installieren
npm install

# Teste lokal
npm run dev

# Committe und pushe Änderungen
git add .
git commit -m "Add Supabase integration"
git push
```

Vercel deployed automatisch bei jedem Push!

## 🔧 Teil 3: Integration in bestehende Components

### Beispiel: Login-Component aktualisieren

In [components/Login.tsx](components/Login.tsx):

```typescript
import { signIn, signUp } from '../services/supabaseClient';

// In deiner handleLogin-Funktion:
const handleLogin = async () => {
  const { data, error } = await signIn(email, password);
  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login successful:', data.user);
  }
};
```

### Beispiel: Testfälle speichern

```typescript
import { supabase } from '../services/supabaseClient';

// Testfall speichern
const saveTestCase = async (testCase) => {
  const { data, error } = await supabase
    .from('test_cases')
    .insert([
      {
        title: testCase.title,
        description: testCase.description,
        steps: testCase.steps,
        priority: testCase.priority,
        status: 'active'
      }
    ])
    .select();
    
  if (error) console.error('Error:', error);
  return data;
};

// Testfälle abrufen
const getTestCases = async () => {
  const { data, error } = await supabase
    .from('test_cases')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) console.error('Error:', error);
  return data;
};
```

## 📝 Nächste Schritte

1. ✅ Vite Config für Environment-Variablen anpassen (bereits erledigt)
2. ✅ Supabase Client Service erstellt
3. 🔄 Login-Component mit Supabase-Auth verbinden
4. 🔄 StorageService durch Supabase-Queries ersetzen
5. 🔄 Realtime-Subscriptions für Live-Updates hinzufügen

## 🔗 Nützliche Links

- [Vercel Dashboard](https://vercel.com/marcels-projects-50d57c36)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

## 🆘 Troubleshooting

### Build schlägt fehl
- Überprüfe, dass alle Environment-Variablen in Vercel gesetzt sind
- Schaue dir die Build-Logs in Vercel an

### Supabase-Verbindung funktioniert nicht
- Überprüfe URL und Keys in Vercel Environment Variables
- Stelle sicher, dass RLS-Policies korrekt konfiguriert sind
- Checke die Supabase Logs im Dashboard

### CORS-Fehler
- Füge deine Vercel-Domain zu den Allowed URLs in Supabase hinzu:
  - Gehe zu Authentication → URL Configuration
  - Füge deine Vercel-URL hinzu (z.B. `https://testmo.vercel.app`)
