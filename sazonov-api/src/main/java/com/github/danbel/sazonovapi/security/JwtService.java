package com.github.danbel.sazonovapi.security;

import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.domain.Role;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final Algorithm algorithm;
    private final JWTVerifier verifier;
    private final long expirationMinutes;

    public JwtService(
        @Value("${app.jwt.secret:dev-secret-change-me-dev-secret-change-me}") String secret,
        @Value("${app.jwt.expiration-minutes:5256000}") long expirationMinutes
    ) {
        this.algorithm = Algorithm.HMAC256(secret);
        this.verifier = JWT.require(algorithm).build();
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(AppUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expirationMinutes, ChronoUnit.MINUTES);

        return JWT.create()
            .withSubject(user.getUsername())
            .withClaim("userId", user.getId())
            .withArrayClaim("roles", List.of("ROLE_" + user.getRole().name()).toArray(new String[0]))
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(expiresAt))
            .sign(algorithm);
    }

    public DecodedJWT verify(String token) throws JWTVerificationException {
        return verifier.verify(token);
    }

    public String usernameFromToken(String token) {
        return verify(token).getSubject();
    }
}
