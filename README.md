# Benesse Quick Massage - Sistema de Agendamento.

Sistema de agendamento de massoterapia desenvolvido para a Benesse, com foco em Quick Massage corporativo.

## Tecnologias.
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React.
- **Backend**: Express (Node.js).
- **Banco de Dados**: Supabase (PostgreSQL).
- **IA**: Google Gemini API (para resumos de agenda).

## Como rodar localmente

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente no arquivo `.env`:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   SUPABASE_URL=sua_url_aqui
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura do Projeto
- `/src`: Componentes React e lógica de frontend.
- `server.ts`: Servidor Express e integração com Supabase.
- `supabase/migrations`: Scripts SQL para inicialização do banco de dados.
