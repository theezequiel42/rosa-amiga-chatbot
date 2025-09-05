// knowledgeBase.ts
import type { KnowledgeChunk } from './types';

export const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: 'apresentacao-rede',
    title: 'Apresentação da Rede de Atendimento à Mulher Vítima de Violência em Fraiburgo',
    content: 'Este é o Protocolo de Atendimento à Mulher Vítima de Violência Doméstica do Município de Fraiburgo. O objetivo é apresentar à população a rede de atendimento e os serviços disponíveis. A violência doméstica é qualquer ação que cause morte, lesão, sofrimento físico, sexual ou psicológico e dano moral ou patrimonial. O Município busca criar estratégias de enfrentamento, prevenção e atenção à violência. Este protocolo organiza os atendimentos para garantir atenção integral a todos os casos.',
    type: 'geral',
    tags: ['rede de atendimento', 'protocolo', 'fraiburgo', 'violência doméstica', 'apresentação']
  },
  {
    id: 'publico-alvo',
    title: 'Público-Alvo da Rede de Proteção',
    content: 'Mulheres acima de 18 anos em situação ou risco de violência residentes em Fraiburgo.',
    type: 'definicao',
    tags: ['público-alvo', 'mulheres', 'violência', 'fraiburgo']
  },
  {
    id: 'objetivo-rede',
    title: 'Objetivo da Rede de Proteção',
    content: 'Apresentar a Rede de Proteção e Atendimento à Mulher Vítima de Violência Doméstica em Fraiburgo e os procedimentos adotados pelos serviços, com a finalidade de oferecer atendimento organizado, integral e humanizado, evitando a revitimização e fortalecendo a rede de suporte.',
    type: 'geral',
    tags: ['objetivo', 'rede de proteção', 'atendimento', 'humanizado', 'revitimização']
  },
  {
    id: 'definicao-violencia-mulher',
    title: 'O que é Violência Contra a Mulher?',
    content: 'A violência contra as mulheres é uma violação dos direitos humanos e um grave problema social e de saúde pública, definida pela Lei Maria da Penha (Lei n. 11.340/2006). É o uso intencional da força ou poder que resulte em lesão, morte, dano psicológico ou privação.',
    type: 'definicao',
    tags: ['violência contra a mulher', 'lei maria da penha', 'direitos humanos', 'definição']
  },
  {
    id: 'tipo-violencia-fisica',
    title: 'Tipos de Violência - Violência Física',
    content: 'Violência Física é qualquer conduta que ofenda a integridade ou saúde corporal. Exemplos: empurrões, tapas, chutes, arranhões, puxar o cabelo, cuspir, sufocamento, estrangulamento, jogar objetos, uso de armas ou tortura.',
    type: 'definicao',
    tags: ['violência física', 'tipos de violência', 'agressão', 'lesão corporal']
  },
  {
    id: 'tipo-violencia-psicologica',
    title: 'Tipos de Violência - Violência Psicológica',
    content: 'Violência Psicológica é qualquer conduta que cause dano emocional, diminuição da autoestima, ou que vise controlar ações, comportamentos e decisões através de ameaça, constrangimento, humilhação, manipulação, isolamento, vigilância constante, insulto, chantagem ou ridicularização. Exemplos: humilhar em público, xingamentos, ameaçar, menosprezar, proibir acesso a amigos e familiares.',
    type: 'definicao',
    tags: ['violência psicológica', 'tipos de violência', 'dano emocional', 'autoestima', 'ameaça', 'humilhação']
  },
  {
    id: 'tipo-violencia-sexual',
    title: 'Tipos de Violência - Violência Sexual',
    content: 'Violência Sexual é qualquer conduta que constranja a presenciar, manter ou participar de relação sexual não desejada; que impeça o uso de método contraceptivo; ou que force ao matrimônio, gravidez, aborto ou prostituição. Exemplos: estupro, forçar sexo com outras pessoas, impedir o uso de contraceptivos, filmar momentos íntimos sem consentimento.',
    type: 'definicao',
    tags: ['violência sexual', 'tipos de violência', 'estupro', 'abuso', 'consentimento']
  },
  {
    id: 'tipo-violencia-patrimonial',
    title: 'Tipos de Violência - Violência Patrimonial',
    content: 'Violência Patrimonial é qualquer conduta que configure retenção, subtração ou destruição de objetos, instrumentos de trabalho, documentos pessoais, bens e valores. Exemplos: impedir a mulher de trabalhar, controlar o dinheiro, destruir documentos, não pagar pensão alimentícia, quebrar objetos pessoais.',
    type: 'definicao',
    tags: ['violência patrimonial', 'tipos de violência', 'bens', 'dinheiro', 'documentos']
  },
  {
    id: 'tipo-violencia-moral',
    title: 'Tipos de Violência - Violência Moral',
    content: 'Violência Moral é qualquer conduta que configure calúnia, difamação ou injúria. Exemplos: acusar de crimes não cometidos, publicar fotos íntimas, espalhar mentiras para prejudicar a reputação, xingar com palavras que ofendam a dignidade.',
    type: 'definicao',
    tags: ['violência moral', 'tipos de violência', 'calúnia', 'difamação', 'injúria', 'reputação']
  },
  {
    id: 'lista-orgaos-rede',
    title: 'Rede Protetiva de Atendimento a Mulher de Fraiburgo - Lista de Órgãos',
    content: 'A rede inclui: Centro de Referência Especializado em Assistência Social (CREAS), Centro de Referência em Assistência Social (CRAS), Secretaria Municipal de Assistência Social, Secretaria Municipal de Educação, Conselho Municipal de Direitos da Mulher (CMDM), Procuradoria Especial da Mulher, Secretaria de Saúde, Hospital Fraiburgo, SAMU, Vigilância Epidemiológica, Polícia Civil (Sala Lilás), Polícia Militar (Rede Catarina), Corpo de Bombeiros, Ministério Público, Poder Judiciário e OAB Por Elas.',
    type: 'servico',
    tags: ['rede protetiva', 'órgãos', 'lista', 'creas', 'cras', 'polícia', 'saúde']
  },
  {
    id: 'funcionamento-rede',
    title: 'Como Funciona a Rede de Atendimento',
    content: 'Todos os serviços da Rede Protetiva são uma porta de entrada para o atendimento. Eles devem acolher de forma qualificada e encaminhar os casos. A Polícia Civil é a referência para o atendimento inicial. Casos de risco iminente de vida devem ser encaminhados para serviços de saúde (hospital, pronto atendimento). Todos os casos devem ser comunicados à vigilância epidemiológica.',
    type: 'procedimento',
    tags: ['funcionamento', 'rede de atendimento', 'procedimento', 'acolhimento', 'polícia civil']
  },
  {
    id: 'sigilo-acolhimento',
    title: 'Sigilo e Acolhimento no Atendimento',
    content: 'Os profissionais devem manter sigilo total sobre as informações pessoais. O atendimento deve ser feito sem julgamentos, com qualidade e respeito à autonomia da mulher. Todas as instituições devem oferecer um acolhimento solidário, informando sobre os procedimentos e possibilidades de proteção para que a mulher se sinta segura e apoiada.',
    type: 'procedimento',
    tags: ['sigilo', 'acolhimento', 'atendimento', 'respeito', 'autonomia']
  },
  {
    id: 'atribuicoes-creas',
    title: 'Atribuições do CREAS (Centro de Referência Especializado em Assistência Social)',
    content: 'O CREAS oferece atendimento psicossocial, ajuda a obter benefícios como cesta básica и aluguel social, rompe com padrões de violência, e encaminha para outros serviços da rede.',
    type: 'servico',
    tags: ['creas', 'atribuições', 'serviços', 'psicossocial', 'benefícios']
  },
  {
    id: 'atribuicoes-cras',
    title: 'Atribuições do CRAS (Centro de Referência em Assistência Social)',
    content: 'O CRAS previne situações de risco e fortalece vínculos familiares. Oferece acompanhamento familiar, avaliação para benefícios, inclusão no Cadastro Único e encaminhamentos para a rede.',
    type: 'servico',
    tags: ['cras', 'atribuições', 'serviços', 'prevenção', 'cadastro único']
  },
  {
    id: 'atribuicoes-secretaria-assistencia-social',
    title: 'Atribuições da Secretaria Municipal de Assistência Social',
    content: 'Responsável pela gestão da política de assistência social, oferece benefícios eventuais, encaminha para assistência jurídica, e, em casos graves, para casa de acolhimento.',
    type: 'servico',
    tags: ['secretaria de assistência social', 'atribuições', 'benefícios', 'assistência jurídica']
  },
  {
    id: 'atribuicoes-secretaria-educacao',
    title: 'Papel da Secretaria Municipal de Educação',
    content: 'A escola tem um papel importante na identificação da violência familiar através do comportamento dos alunos. Professores e gestores devem acolher, orientar e encaminhar os casos para a rede de proteção, como o Conselho Tutelar e o CREAS.',
    type: 'servico',
    tags: ['secretaria de educação', 'escola', 'identificação', 'encaminhamento']
  },
  {
    id: 'atribuicoes-cmdm',
    title: 'Atribuições do Conselho Municipal de Direitos da Mulher (CMDM)',
    content: 'O CMDM fiscaliza e avalia as políticas públicas para mulheres. Promove a articulação entre os órgãos para o enfrentamento da violência e acompanha a qualidade do atendimento.',
    type: 'servico',
    tags: ['cmdm', 'conselho da mulher', 'atribuições', 'fiscalização', 'políticas públicas']
  },
  {
    id: 'atribuicoes-procuradoria-mulher',
    title: 'Atribuições da Procuradoria Especial da Mulher',
    content: 'Atua na Câmara Municipal para defender a igualdade e combater a violência. Fiscaliza o Poder Executivo, sugere leis e encaminha denúncias aos órgãos competentes.',
    type: 'servico',
    tags: ['procuradoria da mulher', 'câmara municipal', 'atribuições', 'denúncias']
  },
  {
    id: 'atribuicoes-secretaria-saude',
    title: 'Papel da Secretaria de Saúde e Unidades de Saúde',
    content: 'Profissionais de saúde devem estar atentos para identificar sinais de violência. Devem prestar atendimento, orientar, e comunicar a autoridade policial em até 24 horas. Em casos de violência sexual, encaminham para a Vigilância Epidemiológica.',
    type: 'servico',
    tags: ['secretaria de saúde', 'unidades de saúde', 'atendimento médico', 'notificação']
  },
  {
    id: 'atribuicoes-hospital',
    title: 'Atribuições do Hospital Fraiburgo',
    content: 'O hospital oferece atendimento humanizado, acolhe mulheres em situação de violência, orienta sobre o registro de Boletim de Ocorrência, aciona a rede de apoio e comunica a autoridade policial.',
    type: 'servico',
    tags: ['hospital fraiburgo', 'atribuições', 'atendimento de saúde', 'boletim de ocorrência']
  },
  {
    id: 'atribuicoes-samu',
    title: 'Atribuições do SAMU (Serviço de Atendimento Móvel de Urgência)',
    content: 'O SAMU, acionado pelo 192, presta atendimento de urgência, acolhe a paciente em um ambiente seguro, e a encaminha para o serviço de saúde adequado, solicitando apoio policial se necessário.',
    type: 'servico',
    tags: ['samu', '192', 'atribuições', 'urgência', 'emergência']
  },
  {
    id: 'atribuicoes-vigilancia-epidemiologica',
    title: 'Atribuições da Vigilância Epidemiológica',
    content: 'Coleta e monitora dados sobre casos de violência para identificar padrões e fatores de risco. Em casos de violência sexual, realiza a profilaxia para Infecções Sexualmente Transmissíveis (ISTs).',
    type: 'servico',
    tags: ['vigilância epidemiológica', 'atribuições', 'dados', 'violência sexual', 'profilaxia', 'ist']
  },
  {
    id: 'atribuicoes-policia-civil',
    title: 'Atribuições da Polícia Civil – Sala Lilás',
    content: 'A Polícia Civil investiga crimes, registra o Boletim de Ocorrência, solicita Medidas Protetivas de Urgência ao Poder Judiciário, encaminha a vítima para exames e informa sobre seus direitos.',
    type: 'servico',
    tags: ['polícia civil', 'sala lilás', 'atribuições', 'boletim de ocorrência', 'medida protetiva']
  },
  {
    id: 'atribuicoes-policia-militar',
    title: 'Atribuições da Polícia Militar – Rede Catarina',
    content: 'A Rede Catarina é um programa da Polícia Militar para prevenir a violência doméstica. Realiza visitas preventivas, orienta as vítimas e oferece o aplicativo PMSC Cidadão com um "botão de pânico" para emergências.',
    type: 'servico',
    tags: ['polícia militar', 'rede catarina', 'atribuições', 'prevenção', 'botão de pânico', '190']
  },
  {
    id: 'atribuicoes-bombeiros',
    title: 'Atribuições do Corpo de Bombeiros',
    content: 'Acionado pelo 193, o Corpo de Bombeiros presta atendimento de emergência, oferecendo suporte físico e emocional à vítima e acionando apoio policial quando necessário para garantir a segurança da cena.',
    type: 'servico',
    tags: ['corpo de bombeiros', '193', 'atribuições', 'emergência', 'socorro']
  },
  {
    id: 'atribuicoes-mp',
    title: 'Atribuições do Ministério Público',
    content: 'O Ministério Público defende a ordem jurídica e os interesses sociais. Promove ações penais para responsabilizar os agressores, fiscaliza a rede de atendimento e pode requisitar medidas de proteção.',
    type: 'servico',
    tags: ['ministério público', 'mp', 'atribuições', 'denúncia', 'ação penal']
  },
  {
    id: 'atribuicoes-judiciario',
    title: 'Papel do Poder Judiciário',
    content: 'O Poder Judiciário julga os casos de violência doméstica, aplica a Lei Maria da Penha, defere medidas protetivas de urgência e fiscaliza o cumprimento das penas, buscando garantir a justiça e a segurança das vítimas.',
    type: 'servico',
    tags: ['poder judiciário', 'atribuições', 'justiça', 'lei maria da penha', 'medida protetiva']
  },
  {
    id: 'atribuicoes-oab',
    title: 'Atribuições da OAB Por Elas',
    content: 'É um projeto que oferece assistência jurídica gratuita para mulheres de baixa renda em situação de violência. Advogados voluntários orientam e atuam nos casos a partir do registro do Boletim de Ocorrência.',
    type: 'servico',
    tags: ['oab por elas', 'atribuições', 'assistência jurídica', 'gratuita', 'advogado']
  },
  {
    id: 'emergencia-numeros',
    title: 'EMERGÊNCIA - NÚMEROS IMPORTANTES',
    content: 'Para emergências, ligue imediatamente:\nPolícia Militar: 190\nSAMU (Atendimento Móvel de Urgência): 192\nCorpo de Bombeiros: 193',
    type: 'emergencia',
    tags: ['emergência', 'números', 'telefones', '190', '192', '193', 'polícia', 'samu', 'bombeiros']
  },
  {
    id: 'contato-creas',
    title: 'CONTATO - CREAS (Centro de Referência Especializado de Assistência Social)',
    content: 'Serviços: Atendimento psicossocial, auxílio com benefícios (cesta básica, aluguel social), encaminhamentos para a rede, cursos profissionalizantes.\nEndereço: Av. Paraná, 677, Bairro Jardim das Hortênsias, Fraiburgo - SC.\nTelefone: (49) 3246-2826\nHorário: 8h às 12h e das 13h30min às 17h30min.',
    type: 'contato',
    tags: ['creas', 'contato', 'endereço', 'telefone', 'horário', 'assistência social']
  },
  {
    id: 'contato-cras',
    title: 'CONTATO - CRAS (Centro de Referência de Assistência Social)',
    content: 'Serviços: Inclusão em grupos de fortalecimento de vínculos, Cadastro Único, avaliação para benefícios, encaminhamentos para a rede.\nEndereço: Av. Pedro Antonio Gianelo, 1142-1214, Bairro São Miguel, Fraiburgo - SC.\nTelefone: (49) 3256-3069 e (49) 3256-3095\nHorário: 7h45min às 11h45min e das 13h15min às 17h15min.',
    type: 'contato',
    tags: ['cras', 'contato', 'endereço', 'telefone', 'horário', 'assistência social']
  },
  {
    id: 'contato-secretaria-assistencia-social',
    title: 'CONTATO - Secretaria Municipal de Assistência Social',
    content: 'Serviços: Estudo social, Cadastro Único, fornecimento de Benefícios Eventuais (cesta básica, passagens), encaminhamento para confecção de documentos e para a rede de apoio.\nEndereço: Rua Arnoldo Frey, 179, Bairro Centro, Fraiburgo-SC.\nTelefone: (49) 3908-2025 ou (49) 3908-2035 ou (49) 99197-7530\nHorário: 8h às 12h e das 13h30min às 17h30min.',
    type: 'contato',
    tags: ['secretaria de assistência social', 'contato', 'endereço', 'telefone', 'horário']
  },
  {
    id: 'contato-secretaria-educacao',
    title: 'CONTATO - Secretaria Municipal de Educação (SME)',
    content: 'Serviços: Realiza campanhas preventivas e aciona órgãos competentes em casos suspeitos ou confirmados envolvendo educandos.\nEndereço: Av. Adalberto Schmidt Burda, 100, Bairro São José, Fraiburgo - SC.\nTelefone: (49) 3256-4250\nHorário: 8h às 12h e das 13h30min às 17h30min.',
    type: 'contato',
    tags: ['secretaria de educação', 'sme', 'contato', 'endereço', 'telefone', 'horário']
  },
  {
    id: 'contato-cmdm',
    title: 'CONTATO - Conselho Municipal dos Direitos da Mulher (CMDM)',
    content: 'Serviços: Articula o enfrentamento à violência, referencia para a rede de atendimento.\nEndereço: R. Arnoldo Frey, 179, Bairro Centro, Fraiburgo-SC.\nTelefone: (49) 3908-2025 e (49) 3908-2035\nHorário: 8h às 12h e das 13h30min às 17h30min.',
    type: 'contato',
    tags: ['cmdm', 'conselho da mulher', 'contato', 'endereço', 'telefone', 'horário']
  },
  {
    id: 'contato-procuradoria-mulher',
    title: 'CONTATO - Procuradoria Especial da Mulher na Câmara Municipal',
    content: 'Serviços: Articulação entre órgãos, fomento ao trabalho em rede, encaminhamentos.\nEndereço: Av. Lebon Régis, 219, Bairro São José, Fraiburgo - SC.\nTelefone: (49) 3246-2764\nHorário: 13h30min às 17h30min.',
    type: 'contato',
    tags: ['procuradoria da mulher', 'contato', 'endereço', 'telefone', 'horário']
  },
  {
    id: 'contato-secretaria-saude',
    title: 'CONTATO - Secretaria Municipal de Saúde',
    content: 'Serviços: Encaminhamento para vigilância epidemiológica (violência sexual), orientação para registro de B.O., apoio psicológico e social.\nEndereço: R. Vito Pizzeta, 77, Bairro Salete, Fraiburgo - SC.\nTelefone: (49) 3256-4000 ou (49) 3256-4029.',
    type: 'contato',
    tags: ['secretaria de saúde', 'contato', 'endereço', 'telefone']
  },
  {
    id: 'contato-hospital',
    title: 'CONTATO - Hospital Fraiburgo',
    content: 'Serviços: Atendimento de saúde, avaliação psicossocial, orientação para registro de B.O., comunicação à autoridade policial.\nEndereço: Av. João Marques Vieira, 979, Bairro Centro, Fraiburgo – SC.\nTelefone: (49) 3246-1012.',
    type: 'contato',
    tags: ['hospital fraiburgo', 'contato', 'endereço', 'telefone']
  },
  {
    id: 'contato-samu',
    title: 'CONTATO - SAMU (Serviço Móvel de Urgência)',
    content: 'Serviços: Socorro em emergências.\nEndereço: R. Vito Pizzeta, 77, Bairro Salete, Fraiburgo - SC.\nTelefone: 192.',
    type: 'contato',
    tags: ['samu', 'contato', 'endereço', 'telefone', 'emergência', '192']
  },
  {
    id: 'contato-vigilancia-epidemiologica',
    title: 'CONTATO - Vigilância Epidemiológica',
    content: 'Serviços: Atendimento e profilaxia para vítimas de violência sexual.\nEndereço: R. Vito Pizzeta, 77, Bairro Salete, Fraiburgo - SC.\nTelefone: (49) 3256-4043\nHorário: 8h às 12h e das 13h30min às 17h30min.',
    type: 'contato',
    tags: ['vigilância epidemiológica', 'contato', 'endereço', 'telefone', 'horário', 'violência sexual']
  },
  {
    id: 'contato-policia-civil',
    title: 'CONTATO - Polícia Civil (Delegacia de Polícia/Sala Lilás)',
    content: 'Serviços: Confecção de Boletim de Ocorrência, pedido de medida protetiva, encaminhamento para IML, investigação.\nEndereço: Av. Caçador, 593, Bairro São José, Fraiburgo - SC.\nTelefone: (49) 3533-5456\nHorário: 12h às 19h.',
    type: 'contato',
    tags: ['polícia civil', 'delegacia', 'sala lilás', 'contato', 'endereço', 'telefone', 'horário', 'boletim de ocorrência']
  },
  {
    id: 'contato-policia-militar',
    title: 'CONTATO - Polícia Militar / Rede Catarina',
    content: 'Serviços: Atendimento policial, visitas preventivas (Rede Catarina), orientação sobre o "botão do pânico".\nEndereço: R. das Azaléias, 1.145, Bairro Jardim das Hortênsias, Fraiburgo - SC.\nTelefone de Emergência: 190.\nOutro Telefone: (49) 3554-8904\nHorário: 24 horas.',
    type: 'contato',
    tags: ['polícia militar', 'rede catarina', 'contato', 'endereço', 'telefone', 'horário', 'emergência', '190']
  },
  {
    id: 'contato-bombeiros',
    title: 'CONTATO - Corpo de Bombeiros',
    content: 'Serviços: Socorro em emergências.\nEndereço: Av. Caçador, 582, Bairro São José, Fraiburgo - SC.\nTelefone: 193.',
    type: 'contato',
    tags: ['corpo de bombeiros', 'contato', 'endereço', 'telefone', 'emergência', '193']
  },
  {
    id: 'contato-mp',
    title: 'CONTATO - Ministério Público de Santa Catarina',
    content: 'Serviços: Acolhimento de denúncias, requisição de inquérito, medidas de prevenção.\nEndereço: Anexo Fórum de Fraiburgo, Av. Curitibanos, 375, Bairro Centro, Fraiburgo - SC.\nTelefone: (49) 99188-2795\nHorário: 12h às 19h.',
    type: 'contato',
    tags: ['ministério público', 'mpsc', 'contato', 'endereço', 'telefone', 'horário', 'denúncia']
  },
  {
    id: 'contato-judiciario',
    title: 'CONTATO - Poder Judiciário de Santa Catarina – Comarca de Fraiburgo',
    content: 'Serviços: Julgamento de processos, deferimento de medidas protetivas.\nEndereço: Av. Curitibanos, 375, Centro, Fraiburgo - SC.\nTelefone: (49) 3521-8216\nHorário: 12h às 19h.',
    type: 'contato',
    tags: ['poder judiciário', 'fórum', 'contato', 'endereço', 'telefone', 'horário']
  },
  {
    id: 'contato-oab',
    title: 'CONTATO - OAB Por Elas',
    content: 'Serviços: Orientação e assistência jurídica gratuita para mulheres de baixa renda.\nEndereço: Sede OAB, Rua Antonio Porto Burda, s/n, Bairro Centro, Fraiburgo - SC.\nTelefone: (49) 3246-2090\nHorário: 13h às 19h.',
    type: 'contato',
    tags: ['oab por elas', 'contato', 'endereço', 'telefone', 'horário', 'advogado', 'jurídico']
  },
];
