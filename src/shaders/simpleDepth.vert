in vec3 position;
in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 lightSpaceMatrix;
uniform mat4 instanceMatrix;

void main() {
	gl_Position = lightSpaceMatrix * modelMatrix * vec4(position, 1.0);
}