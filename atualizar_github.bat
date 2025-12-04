@echo off
echo ==========================================
echo      ATUALIZANDO GITHUB (AUTOMATICO)
echo ==========================================
echo.

:: Pega o nome do branch atual
for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%a
echo Branch atual: %BRANCH%
echo.

echo 1. Adicionando arquivos...
git add .

echo 2. Verificando status...
git status

echo.
set /p CommitMsg="Digite a mensagem do commit (ou Enter para 'Atualizacao automatica'): "
if "%CommitMsg%"=="" set CommitMsg=Atualizacao automatica

echo.
echo 3. Criando commit...
git commit -m "%CommitMsg%"

echo.
echo 4. Atualizando (Pull)...
git pull origin %BRANCH% --rebase

echo.
echo 5. Enviando (Push)...
git push origin %BRANCH%

echo.
echo ==========================================
echo           PROCESSO CONCLUIDO!
echo ==========================================
pause
