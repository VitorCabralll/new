# Script de teste do pipeline completo
$testFile = "C:\Users\Vitor\Desktop\Nova pasta\backend\test\data\1028881-24.2024.8.11.0041 - CBA - Hab. Crédito - fav. ao pedido.pdf"
$agentId = "cmga2uebl0000ve441ylql6zc"  # Teste Pipeline
$instructions = "Analise este documento de habilitação de crédito e gere uma manifestação completa do Ministério Público."

Write-Host "🚀 Iniciando teste do pipeline completo..." -ForegroundColor Green

# Testar upload e processamento
$form = @{
    file = Get-Item $testFile
    instructions = $instructions
    agentId = $agentId
}

Write-Host "📄 Enviando arquivo: $((Get-Item $testFile).Name)" -ForegroundColor Blue
Write-Host "🤖 Usando agente: $agentId" -ForegroundColor Blue
Write-Host "📝 Instruções: $instructions" -ForegroundColor Blue

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/generate" -Method POST -Form $form
    
    Write-Host "✅ Pipeline executado com sucesso!" -ForegroundColor Green
    Write-Host "📊 Qualidade: $($response.quality.score)/10" -ForegroundColor Yellow
    Write-Host "🔄 Melhorado: $($response.improved)" -ForegroundColor Yellow
    Write-Host "🆔 Session ID: $($response.sessionId)" -ForegroundColor Cyan
    
    # Salvar resultado para análise
    $response.result | Out-File "C:\Users\Vitor\Desktop\Nova pasta\backend\test_result.txt" -Encoding UTF8
    Write-Host "💾 Resultado salvo em: test_result.txt" -ForegroundColor Green
    
    # Testar refinamento se sessão foi criada
    if ($response.sessionId) {
        Write-Host "`n🔄 Testando refinamento da sessão..." -ForegroundColor Blue
        
        $refineData = @{
            userPrompt = "Torne a linguagem mais técnica e adicione mais fundamentação legal."
        } | ConvertTo-Json
        
        $refineResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/sessions/$($response.sessionId)/refine" -Method POST -Body $refineData -ContentType "application/json"
        
        Write-Host "✅ Refinamento executado com sucesso!" -ForegroundColor Green
        Write-Host "💰 Tokens usados no refinamento: $($refineResponse.tokensUsed)" -ForegroundColor Yellow
        
        # Salvar resultado refinado
        $refineResponse.result | Out-File "C:\Users\Vitor\Desktop\Nova pasta\backend\test_result_refined.txt" -Encoding UTF8
        Write-Host "💾 Resultado refinado salvo em: test_result_refined.txt" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Erro no pipeline: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalhes: $($_.Exception)" -ForegroundColor Red
}

Write-Host "`n🏁 Teste concluído!" -ForegroundColor Green