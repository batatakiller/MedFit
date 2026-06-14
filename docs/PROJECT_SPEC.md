# 📋 Especificação do Projeto (PROJECT_SPEC.md)

Este documento descreve as funcionalidades, objetivos e especificações de negócio do **Med Fit**.

---

## 🎯 1. Visão Geral do Produto
O Med Fit é uma plataforma SaaS (Software as a Service) focada no acompanhamento de saúde, composição corporal, dieta e treinos físicos de pacientes. O grande diferencial está na orquestração de uma **equipe multidisciplinar virtual baseada em IA multiagente (LangGraph)**, complementada por **visão computacional híbrida (MediaPipe)** para análise física.

---

## 📱 2. Experiência do Paciente & Funcionalidades

### A. Fluxo de Onboarding
Quando um novo usuário se cadastra, ele passa por uma jornada de Onboarding obrigatória:
1.  **Dados Pessoais:** Nome, idade, sexo biológico, altura.
2.  **Consentimento LGPD:** Aceite explícito de termos e consentimentos específicos para armazenamento de dados clínicos, fotos e histórico.
3.  **Histórico Clínico:** Condições clínicas diagnosticadas (hipertensão, diabetes, asma, etc.), dores recorrentes ou lesões limitantes.
4.  **Uso de Medicamentos:** Registro de remédios em uso contínuo ou temporário (apenas para fins informativos e lembretes).
5.  **Estilo de Vida:** Horas de sono médias, nível de estresse (baixo/médio/alto), nível de atividade física habitual.
6.  **Objetivo do Paciente:** Tipo de objetivo (hipertrofia, emagrecimento, recondicionamento, etc.), descrição do corpo ideal, prazo para a meta e motivação pessoal.

### B. Módulo de Dieta
*   **Visualização de Plano:** Dieta detalhada gerada pela IA, separada por refeições (Café, Almoço, Lanche, Jantar).
*   **Macronutrientes:** Acompanhamento de metas de Proteínas, Carboidratos, Gorduras e Calorias.
*   **Ingestão de Água:** Tracker diário com indicador visual de progresso e meta personalizada em ml.
*   **Histórico de Refeições:** Registro simples da adesão do paciente ao plano alimentar ao longo do dia.

### C. Módulo de Treino
*   **Plano Semanal Progressivo:** Treino planejado conforme os equipamentos disponíveis (academia, peso corporal, etc.) e o nível de experiência (sedentário até atleta).
*   **Treino do Dia:** Relação de exercícios, séries, repetições, carga recomendada e tempo de descanso.
*   **Cronômetro:** Auxiliar integrado na tela para monitoramento do intervalo de descanso entre as séries.
*   **Log de Carga:** Registro de cargas e repetições reais realizadas pelo paciente para subsidiar a progressão de carga futura pela IA.

### D. Análise Corporal por Imagem (Body Vision)
*   **Upload de Fotos:** Upload de 3 fotos principais (frente, costas e perfil).
*   **Processamento Geométrico:** Detecção de pontos anatômicos chaves da postura (landmarks) no navegador via MediaPipe.
*   **Composição Corporal:** Estimativa de percentual de gordura baseada nas fórmulas da Marinha Americana (US Navy) e Deurenberg, calculando perímetros de cintura, quadril, pescoço e abdômen.
*   **Comparativo Visual:** Galeria do tipo antes/depois para visualização lado a lado do progresso.

### E. Mapeamento de Exames e OCR
*   **Upload de Laudos:** Envio de arquivos em formato PDF ou imagem contendo exames de sangue ou laudos clínicos.
*   **OCR Integrado:** Processamento local de extração de texto via `tesseract.js` para identificação de termos e exames alterados para o agente médico da IA analisar.

---

## 👥 3. Dados de Seed (Pacientes Demo)
Para facilitar testes e demonstrações de fluxos complexos, o sistema já possui dois pacientes fictícios com históricos completos de 30 dias:

### Paciente 1: Carlos (Carlos@medfit.demo)
*   **Perfil:** 42 anos, 1.75m, 98kg (sobrepeso).
*   **Clínico:** Pressão alta (Hipertensão), Diabetes Tipo 2. Dor lombar leve.
*   **Objetivo:** Emagrecimento saudável.
*   **Dieta atual:** Hipercalórica e rica em alimentos ultraprocessados.
*   **Comportamento da IA:** A equipe de IA gera um plano altamente preventivo, focado em treinos de baixo impacto e dieta com restrição calórica moderada (sem déficits extremos) com alertas clínicos constantes.

### Paciente 2: Rafael (rafael@medfit.demo)
*   **Perfil:** 28 anos, 1.80m, 70kg (ectomorfo/magro).
*   **Clínico:** Sem condições clínicas pré-existentes ou limitações físicas.
*   **Objetivo:** Ganho de massa muscular (Hipertrofia) e definição abdominal.
*   **Dieta atual:** Normocalórica, mas com baixa ingestão proteica.
*   **Comportamento da IA:** A equipe de IA gera um plano de hipertrofia com progressão de carga estruturada e dieta hipercalórica com foco em alta densidade de proteínas.
