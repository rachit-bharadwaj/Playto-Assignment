from rest_framework import serializers
from .models import User, Post, Comment, Like
from django.contrib.contenttypes.models import ContentType

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'post', 'parent', 'content', 'created_at', 'likes_count', 'replies']
        extra_kwargs = {
            'post': {'write_only': True},
            'parent': {'write_only': True},
        }

    def get_replies(self, obj):
        # We expect the view to have populated `_replies` list on the object to avoid N+1
        if hasattr(obj, '_replies'):
            return CommentSerializer(obj._replies, many=True).data
        return []

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'created_at', 'likes_count']

class PostDetailSerializer(PostSerializer):
    comments = serializers.SerializerMethodField()

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['comments']

    def get_comments(self, obj):
        # The view should provide the root comments with their children pre-attached
        if hasattr(obj, '_precomputed_comments'):
            return CommentSerializer(obj._precomputed_comments, many=True).data
        return []

class LikeSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=['post', 'comment'])
    id = serializers.IntegerField()
    
    def create(self, validated_data):
        # Allow user to be passed via save(user=...) or fall back to request.user
        user = validated_data.get('user') or self.context['request'].user
        obj_type = validated_data['type']
        obj_id = validated_data['id']
        
        if obj_type == 'post':
            model = Post
        else:
            model = Comment
            
        try:
            obj = model.objects.get(id=obj_id)
        except model.DoesNotExist:
            raise serializers.ValidationError("Object not found")
            
        content_type = ContentType.objects.get_for_model(model)
        
        # We will handle concurrency in the view, but creation logic is here or in view.
        # Let's just return the data needed for the view to create it.
        return {
            'user': user,
            'content_type': content_type,
            'object_id': obj.id
        }

class LeaderboardSerializer(serializers.ModelSerializer):
    score = serializers.IntegerField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'score']
