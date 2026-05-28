export interface ClassificationResult {
  setor: 'manutencao' | 'producao' | 'qualidade' | 'pcp' | 'compras' | 'seguranca' | 'ti' | 'outros';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  urgencia: 'baixa' | 'media' | 'alta';
  tipo: 'parada_maquina' | 'falta_material' | 'qualidade' | 'seguranca' | 'manutencao_preventiva' | 'outros';
  sla_horas: number;
  maquina: string | null;
  op: string | null;
  justificativa: string;
}

export interface IAIClassifier {
  classify(text: string): Promise<ClassificationResult>;
}
