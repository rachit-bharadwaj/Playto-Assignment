from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Sum, Case, When, IntegerField, F, Prefetch, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce
from django.db import IntegrityError, transaction
from django.utils import timezone
from datetime import timedelta
from django.contrib.contenttypes.models import ContentType

from .models import Post, Comment, Like, User
from .serializers import PostSerializer, PostDetailSerializer, CommentSerializer, LikeSerializer, LeaderboardSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().select_related('author').annotate(
        likes_count=Count('likes')
    ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostSerializer

    def perform_create(self, serializer):
        # Mock Auth: Check for username in body
        username = self.request.data.get('username')
        if username:
            user = User.objects.filter(username=username).first()
            if user:
                serializer.save(author=user)
                return

        # Fallback to authenticates user
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
             # Fallback for demo: use first user if available
            first_user = User.objects.first()
            if first_user:
                serializer.save(author=first_user)
            else:
                raise IntegrityError("No user available for post creation")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        comments = Comment.objects.filter(post=instance).select_related('author').annotate(
            likes_count=Count('likes')
        ).order_by('created_at')
        
        comment_map = {c.id: c for c in comments}
        roots = []
        
        for comment in comments:
            comment._replies = []
            
        for comment in comments:
            if comment.parent_id:
                parent = comment_map.get(comment.parent_id)
                if parent:
                    parent._replies.append(comment)
            else:
                roots.append(comment)
                
        instance._precomputed_comments = roots
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def perform_create(self, serializer):
        # Mock Auth: Check for username in body
        username = self.request.data.get('username')
        if username:
            user = User.objects.filter(username=username).first()
            if user:
                serializer.save(author=user)
                return

        # Fallback to authenticated user
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
             # Fallback for demo: use first user if available
            first_user = User.objects.first()
            if first_user:
                serializer.save(author=first_user)
            else:
                raise IntegrityError("No user available for comment creation")

class LikeViewSet(viewsets.ViewSet):
    def create(self, request):
        serializer = LikeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Mock Auth Logic
            user = request.user
            username = request.data.get('username')
            if username:
                found_user = User.objects.filter(username=username).first()
                if found_user:
                    user = found_user
            
            # If still anonymous (and not valid), serializer.save() might fail if we don't pass user
            # But we modified serializer to look in validated_data
            
            # If user is anonymous and no username provided, we might want to default or fail.
            if not user.is_authenticated:
                 # Try default user for demo robustness
                 user = User.objects.first()
                 
            try:
                data = serializer.save(user=user)
                Like.objects.create(
                    user=data['user'],
                    content_type=data['content_type'],
                    object_id=data['object_id']
                )
                return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({'status': 'already liked'}, status=status.HTTP_200_OK)
            except Exception as e:
                 return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LeaderboardView(generics.ListAPIView):
    serializer_class = LeaderboardSerializer
    
    def get_queryset(self):
        cutoff = timezone.now() - timedelta(hours=24)
        
        # Karma from Posts (5 points per like)
        # Karma from Posts (5 points per like) using Subquery to avoid cross-product joins
        # Simplified Subquery:
        # We want to select Sum(likes) from Like joined with Post where Post.author = OuterRef.
        
        posts_karma_sq = Subquery(
            Post.objects.filter(author=OuterRef('pk'))
            .values('author')
            .annotate(
                s=Sum(
                    Case(When(likes__created_at__gte=cutoff, then=5), default=0, output_field=IntegerField())
                )
            )
            .values('s')
        )

        comments_karma_sq = Subquery(
            Comment.objects.filter(author=OuterRef('pk'))
            .values('author')
            .annotate(
                s=Sum(
                    Case(When(likes__created_at__gte=cutoff, then=1), default=0, output_field=IntegerField())
                )
            )
            .values('s')
        )

        return User.objects.annotate(
            score=Coalesce(posts_karma_sq, Value(0)) + Coalesce(comments_karma_sq, Value(0))
        ).filter(score__gt=0).order_by('-score')[:5]
