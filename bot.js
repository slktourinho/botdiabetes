const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Criação do cliente
const client = new Client({
    authStrategy: new LocalAuth(), // Usar autenticação local para não precisar logar toda vez
});

// Gerar QR Code para autenticação
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true }); // Exibe QR Code no terminal
});

// Conectar ao WhatsApp
client.on('ready', () => {
    console.log('Bot está pronto!');
});

// Função para calcular a quantidade de unidades de insulina
const calcularInsulina = (glicemia) => {
    const glicemiaIdeal = 140;
    const reducaoPorUnidade = 30; // Cada unidade de insulina reduz 30 mg/dl

    if (glicemia > 150) {
        // Calculando quantas unidades são necessárias
        const unidades = Math.ceil((glicemia - glicemiaIdeal) / reducaoPorUnidade);
        return unidades;
    } else {
        // Se a glicemia estiver entre 140 e 150, não precisa de insulina
        return 0;
    }
};

// Função para calcular insulina caso seja "jejum"
const calcularInsulinaJejum = (glicemia) => {
    // Divide o valor da glicemia por 30 para calcular a quantidade a tomar
    const unidades = Math.ceil(glicemia / 30);
    return unidades;
};

// Função para enviar o texto da orientação sobre a insulina
const enviarTextoInsulina = (message, glicemia, unidadesInsulina) => {
    const texto = `
Sua glicemia está em ${glicemia} mg/dl.

🟡 ${unidadesInsulina} unidade(s) de insulina são necessárias para reduzir até 140 mg/dl.
    `;
    message.reply(texto); // Envia o texto com o valor da glicemia e a orientação
};

// Função para orientar fazer uma refeição saudável (se glicemia estiver abaixo de 80 mg/dl)
const orientarRefeicao = (message, glicemia) => {
    const textoRefeicao = `
Sua glicemia está em ${glicemia} mg/dl.

É muito importante que você faça uma refeição saudável para evitar que a glicemia caia ainda mais.

Recomendações:
    - Coma alimentos ricos em fibras, como vegetais e frutas.
    - Considere incluir uma fonte de proteína magra, como ovos ou frango.
    - Beba bastante água e evite alimentos com alto índice glicêmico.

Mantenha a glicemia estável e cuide da sua saúde!
    `;
    message.reply(textoRefeicao); // Envia a mensagem com a orientação para refeição saudável
};

// Mensagem padrão de lembrete (somente o texto do lembrete sem áudio)
const enviarLembrete = (message) => {
    const lembrete = `
⚠️ LEMBRE-SE SEMPRE:

💉🟢 20 UI | ☕️ CAFÉ DA MANHÃ
💉🟢 20 UI | 🥗 ALMOÇO
💉🟢 20 UI | 🥪 AO DORMIR

[FAZER UMA REFEIÇÃO LEVE]
    `;
    
    message.reply(lembrete); // Envia o texto de lembrete (sem áudio)
};

// Responder a mensagens
client.on('message', message => {
    const comando = message.body.trim(); // Pegamos o valor enviado

    // Verifica se a mensagem contém apenas um número ou um número seguido de "jejum"
    const temJejum = comando.toLowerCase().includes("jejum");
    const glicemia = parseInt(comando.split(" ")[0]); // Pega o primeiro valor, que é a glicemia

    // Verifica se a glicemia está sendo enviada no formato correto
    if (comando === 'oi') {
        message.reply('Olá, tudo bem com você? Como posso ajudar?');
    } else if (!isNaN(glicemia)) { // Se for um número
        if (temJejum) {
            // Se tiver a palavra "jejum", divide o valor da glicemia por 30
            const unidadesInsulina = calcularInsulinaJejum(glicemia);
            enviarTextoInsulina(message, glicemia, unidadesInsulina); // Envia o texto da orientação de insulina
        } else {
            // Se a glicemia for menor que 80, recomenda uma refeição
            if (glicemia < 80) {
                orientarRefeicao(message, glicemia); // Envia a orientação de refeição saudável
            } else {
                // Calcula a quantidade de unidades de insulina necessárias
                const unidadesInsulina = calcularInsulina(glicemia);

                if (unidadesInsulina > 0) {
                    enviarTextoInsulina(message, glicemia, unidadesInsulina); // Envia o texto da orientação de insulina
                } else {
                    // Resposta para glicemia entre 140 e 150, sem necessidade de insulina
                    message.reply(`Sua glicemia está em ${glicemia} mg/dl, o que está dentro da faixa ideal ou ligeiramente elevada. Não é necessário tomar insulina.`);
                }
            }
        }

        // Enviar a mensagem de lembrete após a resposta de glicemia
        setTimeout(() => {
            enviarLembrete(message); // Envia o lembrete após 3 segundos
        }, 3000); // 3 segundos de atraso
    } else {
        // Se não for um número ou não for um número seguido de "jejum", o bot não responde
        console.log('Mensagem ignorada: não é número válido ou não contém a palavra "jejum".');
    }
});

// Iniciar o bot
client.initialize();
