
attribute float alpha;
attribute vec3 color;

varying float vAlpha;
varying vec3 vColor;

// Phong Lighting Uniforms
uniform int phong;
uniform vec3 ambientLightIntensity;
uniform vec3 sunDirection;
uniform vec3 sunIntensity;
uniform float size;

void main() {

    vAlpha = alpha;
    
	vColor = color;
	if (phong==1) {		// Add Phong Lighting if desired
		vec3 surfaceNormal = normalize( position );
		vec3 normSunDir = normalize( sunDirection );
		vec3 lightIntensity = ambientLightIntensity + sunIntensity * max(dot(surfaceNormal, normSunDir),0.0);
		vColor = color * lightIntensity;
	}	
	
    gl_PointSize = size;

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;

}