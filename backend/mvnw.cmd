@echo off
setlocal
set "DIRNAME=%~dp0"
set "MAVEN_WRAPPER_JAR=%DIRNAME%.mvn\wrapper\maven-wrapper.jar"
if defined JAVA_HOME (
  set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
) else (
  set "JAVA_EXE=java"
)
"%JAVA_EXE%" -cp "%MAVEN_WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
