package com.cyuzuzo.backend;

import com.cyuzuzo.backend.config.LocalEnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CyuzuzoBackendApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(CyuzuzoBackendApplication.class);
        application.setDefaultProperties(LocalEnvLoader.loadDefaultProperties());
        application.run(args);
    }
}
