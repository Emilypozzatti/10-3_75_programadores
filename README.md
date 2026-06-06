## Equipe: 3,75 programadores

# Membros:
- Emily Pozzatti - Programadora
- Fábio Moreira - Designer
- Lucas Bonadeo - Designer
- Marcos Krauspenhar - Programador

- Hebert Medeiros - NÃO PODE COMPARECER

# Escopo do Projeto:
O projeto foi desenvolvido para auxiliar produtores rurais na identificação de doenças em plantas de forma rápida e acessível. A solução permite que o usuário envie uma foto da planta para análise, identificando sua espécie, avaliando seu estado de saúde e sugerindo possíveis tratamentos com o auxílio de inteligência artificial. Além disso, o sistema registra diagnósticos e atividades em um diário rural digital.

# Stack Tecnológica:
A aplicação foi construída utilizando React, TypeScript e Vite no frontend, enquanto o backend utiliza Node.js e Express. Durante o desenvolvimento, os dados foram armazenados por meio do JSON Server. Também foram integradas as APIs Plant.id, responsável pela identificação das plantas e doenças, MyMemory, utilizada para tradução de descrições, e Groq, responsável pela geração das recomendações de tratamento.

# Arquitetura:
A arquitetura funciona da seguinte forma: o usuário envia uma imagem da planta, que é analisada pela API Plant.id. Os dados obtidos são enviados ao backend, que consulta a inteligência artificial para gerar recomendações de tratamento. Por fim, os resultados são exibidos ao usuário e podem ser salvos no diário rural.

# Situação do Projeto:
Atualmente, o sistema já realiza upload de imagens, identificação de plantas, detecção de doenças, geração de tratamentos por IA e armazenamento dos registros no diário. Como melhorias futuras, estão previstas a implementação de um banco de dados profissional, autenticação de usuários e aprimoramentos na interface e na experiência do usuário.

## Link Pitch
https://www.youtube.com/watch?v=SPPkOhT8FqI

## Instruções de como rodar a aplicação
Baixar: https://nodejs.org/pt-br com npm

# No terminal 
npm init -y
npm create vite@latest
Escolher React e Typescript

# Para rodar o front
cd projeto_front/
npm install
npm install react-router-dom
- npm run vite

# Para rodar o Banco
npm install react-router-dom
- npx json-server --watch db.json --port 3000

# Para rodar o back
cd projeto_back/
npm init -y
npm install express
npm install cors
npm install axios
npm install dotenv

- node server.js